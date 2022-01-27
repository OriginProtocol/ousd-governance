// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/governance/utils/IVotes.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeCast.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title VoteLocker
 * @notice VoteLocker is smart contract that supports locking up of a staking token for increased
 *         governance voting power. It is largely based on the ERC20Votes contract from openzeppelin
 *         with some modificaitons to allow it to support lockups/vote boosting.
 *
 * - Voting power is determined by stake amount and lockup duration.
 * - Implements a subset of the ERC20 standard (no transfers, allowance, etc.)
 * - Implements the interfaces required by OpenZeppelin 4.x governance (VoteLocker) stack and exposes
 *   the amount of votes a user has and total votes through standard ERC20 balanceOf/totalSupply
 *   getters.
 * - Supports delegation of votes.
 *
 * TODO resolve issues with extending lockup expiry and fromTimestamp
 * TODO vote boost never goes away after expiry ;(
 */

contract VoteLocker is IVotes {
    ///@notice ERC20 parameters
    string private _name;
    string private _symbol;
    uint8 private _decimals;

    struct Stake {
        bool initialised;
        uint256 fromTimestamp;
        uint256 expiry; // Timestamp of lockup expiry
        uint224 amount; // Amount of staked tokens user has
    }

    struct Checkpoint {
        uint32 fromBlock;
        uint224 votes;
    }

    bytes32 private constant _DELEGATION_TYPEHASH =
        keccak256("Delegation(address delegatee,uint256 nonce,uint256 expiry)");

    /// @notice Maximum lock time
    uint256 public constant MAX_LOCK_TIME = 4 * 365 * 86400; // 4 years
    /// @notice Minimum lock time
    uint256 public constant MIN_LOCK_TIME = 7 * 86400; // 7 days
    /// @notice Vote boost if locked for maximum duration
    uint256 public constant MAX_VOTE_BOOST = 4 * 10**18;
    /// @notice Delegate information
    mapping(address => address) private _delegates;
    /// @notice Checkpoints for each user
    mapping(address => Checkpoint[]) private _checkpoints;
    /// @notice Stake for each user
    mapping(address => Stake) private _stakes;
    /// @notice Global checkpoints
    Checkpoint[] private _totalSupplyCheckpoints;
    /// @notice Token used for creating lockups
    ERC20 public stakingToken;

    constructor(address _stakingToken) {
        stakingToken = ERC20(_stakingToken);
        _name = string(bytes.concat(bytes("Vote Locked"), " ", bytes(stakingToken.name())));
        _symbol = string(bytes.concat(bytes("vl"), bytes(stakingToken.symbol())));
        _decimals = stakingToken.decimals();
    }

    /**
     * @dev Returns the name of the token.
     */
    function name() public view virtual returns (string memory) {
        return _name;
    }

    /**
     * @dev Returns the symbol of the token, usually a shorter version of the
     * name.
     */
    function symbol() public view virtual returns (string memory) {
        return _symbol;
    }

    /**
     * @dev Returns the number of decimals used to get its user representation.
     * For example, if `decimals` equals `2`, a balance of `505` tokens should
     * be displayed to a user as `5.05` (`505 / 10 ** 2`).
     *
     * Tokens usually opt for a value of 18, imitating the relationship between
     * Ether and Wei. This is the value {ERC20} uses, unless this function is
     * overridden;
     */
    function decimals() public view virtual returns (uint8) {
        return _decimals;
    }

    /**
     * @dev See {ERC20-totalSupply}.
     */
    function totalSupply() public view virtual returns (uint256) {
        return
            _totalSupplyCheckpoints[_totalSupplyCheckpoints.length - 1].votes;
    }

    /**
     * @dev See {ERC20-balanceOf}.
     */
    function balanceOf(address _account) public view virtual returns (uint256) {
        return getVotes(_account);
    }

    /**
     * @dev Get the `pos`-th checkpoint for `account`.
     */
    function checkpoints(address account, uint32 pos)
        public
        view
        virtual
        returns (Checkpoint memory)
    {
        return _checkpoints[account][pos];
    }

    /**
     * @dev Get number of checkpoints for `account`.
     */
    function numCheckpoints(address account)
        public
        view
        virtual
        returns (uint32)
    {
        return SafeCast.toUint32(_checkpoints[account].length);
    }

    /**
     * @dev Get the address `account` is currently delegating to.
     */
    function delegates(address account) public view virtual returns (address) {
        return _delegates[account];
    }

    /**
     * @dev Gets the current votes balance for `account`
     */
    function getVotes(address account) public view returns (uint256) {
        uint256 pos = _checkpoints[account].length;
        return pos == 0 ? 0 : _checkpoints[account][pos - 1].votes;
    }

    /**
     * @dev Retrieve the number of votes for `account` at the end of `blockNumber`.
     *
     * Requirements:
     *
     * - `blockNumber` must have been already mined
     */
    function getPastVotes(address account, uint256 blockNumber)
        public
        view
        returns (uint256)
    {
        require(blockNumber < block.number, "VoteLocker: block not yet mined");
        return _checkpointsLookup(_checkpoints[account], blockNumber);
    }

    /**
     * @dev Retrieve the `totalSupply` at the end of `blockNumber`. Note, this value is the sum of all balances.
     * It is but NOT the sum of all the delegated votes!
     *
     * Requirements:
     *
     * - `blockNumber` must have been already mined
     */
    function getPastTotalSupply(uint256 blockNumber)
        public
        view
        returns (uint256)
    {
        require(blockNumber < block.number, "VoteLocker: block not yet mined");
        return _checkpointsLookup(_totalSupplyCheckpoints, blockNumber);
    }

    /**
     * @dev Lookup a value in a list of (sorted) checkpoints.
     */
    function _checkpointsLookup(
        Checkpoint[] storage ckpts,
        uint256 blockNumber
    ) private view returns (uint256) {
        // We run a binary search to look for the earliest checkpoint taken after `blockNumber`.
        //
        // During the loop, the index of the wanted checkpoint remains in the range [low-1, high).
        // With each iteration, either `low` or `high` is moved towards the middle of the range to maintain the invariant.
        // - If the middle checkpoint is after `blockNumber`, we look in [low, mid)
        // - If the middle checkpoint is before or equal to `blockNumber`, we look in [mid+1, high)
        // Once we reach a single value (when low == high), we've found the right checkpoint at the index high-1, if not
        // out of bounds (in which case we're looking too far in the past and the result is 0).
        // Note that if the latest checkpoint available is exactly for `blockNumber`, we end up with an index that is
        // past the end of the array, so we technically don't find a checkpoint after `blockNumber`, but it works out
        // the same.
        uint256 high = ckpts.length;
        uint256 low = 0;
        while (low < high) {
            uint256 mid = Math.average(low, high);
            if (ckpts[mid].fromBlock > blockNumber) {
                high = mid;
            } else {
                low = mid + 1;
            }
        }
        return high == 0 ? 0 : ckpts[high - 1].votes;
    }

    /**
     * @dev Calculate the votes from a stake and expiry in a checkpoint. Note this does not
     *      include delegated votes which are accounte for in the `votes` field of the checkpoint.
     */
    function _calculateVotesFromStake(
        uint256 amount,
        uint256 expiry,
        uint256 fromTimestamp
    ) private view returns (uint256) {
        uint256 lockupProportion = (expiry - fromTimestamp) / MAX_LOCK_TIME;
        uint256 boost = MAX_VOTE_BOOST * lockupProportion;
        return amount * boost;
    }

    /**
     * @dev Delegate votes from the sender to `delegatee`.
     */
    function delegate(address delegatee) public virtual {
        _delegate(msg.sender, delegatee);
    }

    /**
     * @dev Delegates votes from signer to `delegatee`
     */
    function delegateBySig(
        address delegatee,
        uint256 nonce,
        uint256 expiry,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public virtual {
        revert("Delegation by signature is not supported");
    }

    /**
     * @dev Maximum token supply. Defaults to `type(uint224).max` (2^224^ - 1).
     */
    function _maxSupply() internal view virtual returns (uint224) {
        return type(uint224).max;
    }

    /**
     * @dev Deposits staking token and mints new tokens according to the MAX_VOTE_BOOST and _expiry parameters.
     */
    function deposit(uint256 amount, uint256 expiry) public virtual {
        require(expiry > block.timestamp, "Expiry must be in the future");
        require(
            expiry < block.timestamp + MAX_LOCK_TIME,
            "Expiry must be before maximum lockup time"
        );
        require(
            expiry > block.timestamp + MIN_LOCK_TIME,
            "Expiry must be after minimum lockup time"
        );

        Stake memory existingStake = _stakes[msg.sender];

        if (!existingStake.initialised) {
            existingStake = Stake({
                initialised: true,
                fromTimestamp: block.timestamp,
                amount: SafeCast.toUint224(amount),
                expiry: expiry
            });
        } else {
            // Update existing stake
            // TODO allow fromTimestamp unchanged if expiry unchanged?
            existingStake = Stake({
                initialised: true,
                fromTimestamp: block.timestamp,
                amount: SafeCast.toUint224(existingStake.amount + amount),
                expiry: expiry
            });
        }

        if (amount > 0) {
            // If amount is 0, this might just be an expiry change
            stakingToken.transferFrom(msg.sender, address(this), amount);
        }

        // Update votes by writing checkpoint
        uint256 pos = _checkpoints[msg.sender].length;
        uint256 oldVotes = pos == 0
            ? 0
            : _checkpoints[msg.sender][pos - 1].votes;
        uint256 newVotes = _calculateVotesFromStake(
            existingStake.amount,
            existingStake.expiry,
            block.timestamp
        );
        _writeCheckpoint(
            _checkpoints[msg.sender],
            _subtract,
            newVotes - oldVotes
        );

        // Mint the vote delta
        _mint(msg.sender, newVotes - oldVotes);
    }

    /**
     * @dev Snapshots the totalSupply after it has been increased.
     */
    function _mint(address account, uint256 amount) internal virtual {
        require(
            totalSupply() <= _maxSupply(),
            "VoteLocker: total supply risks overflowing votes"
        );
        _writeCheckpoint(_totalSupplyCheckpoints, _add, amount);
    }

    /**
     * @dev Withdraw tokens from an expired lockup.
     */
    function withdraw(uint256 amount) public {
        require(amount > 0, "Amount must be greater than 0");

        Stake memory existingStake = _stakes[msg.sender];
        require(existingStake.amount > 0, "No stake to withdraw");
        require(existingStake.expiry <= block.timestamp, "Lockup not expired");

        existingStake.amount -= SafeCast.toUint224(amount);

        if (amount > 0) {
            // Transfer staking token back to sender
            stakingToken.transfer(msg.sender, amount);
        }

        // Update votes by writing checkpoint
        uint256 pos = _checkpoints[msg.sender].length;
        uint256 oldVotes = pos == 0
            ? 0
            : _checkpoints[msg.sender][pos - 1].votes;
        uint256 newVotes = _calculateVotesFromStake(
            existingStake.amount,
            existingStake.expiry,
            block.timestamp
        );
        _writeCheckpoint(
            _checkpoints[msg.sender],
            _subtract,
            oldVotes - newVotes
        );

        // Burn the vote delta
        _burn(msg.sender, oldVotes - newVotes);
    }

    /**
     * @dev Snapshots the totalSupply after it has been decreased.
     */
    function _burn(address account, uint256 amount) internal virtual {
        _writeCheckpoint(_totalSupplyCheckpoints, _subtract, amount);
    }

    /**
     * @dev Change delegation for `delegator` to `delegatee`.
     *
     * Emits events {DelegateChanged} and {DelegateVotesChanged}.
     */
    function _delegate(address delegator, address delegatee) internal virtual {
        address currentDelegate = delegates(delegator);
        uint256 delegatorBalance = balanceOf(delegator);
        _delegates[delegator] = delegatee;

        emit DelegateChanged(delegator, currentDelegate, delegatee);

        _moveVotingPower(currentDelegate, delegatee, delegatorBalance);
    }

    /**
     * @dev Move voting power from `src` to `dst`
     *
     * Emits events {DelegateVotesChanged}.
     */
    function _moveVotingPower(
        address src,
        address dst,
        uint256 amount
    ) private {
        if (src != dst && amount > 0) {
            if (src != address(0)) {
                (uint256 oldWeight, uint256 newWeight) = _writeCheckpoint(
                    _checkpoints[src],
                    _subtract,
                    amount
                );
                emit DelegateVotesChanged(src, oldWeight, newWeight);
            }

            if (dst != address(0)) {
                (uint256 oldWeight, uint256 newWeight) = _writeCheckpoint(
                    _checkpoints[dst],
                    _add,
                    amount
                );
                emit DelegateVotesChanged(dst, oldWeight, newWeight);
            }
        }
    }

    function _writeCheckpoint(
        Checkpoint[] storage ckpts,
        function(uint256, uint256) view returns (uint256) op,
        uint256 delta
    ) private returns (uint256 oldWeight, uint256 newWeight) {
        uint256 pos = ckpts.length;
        oldWeight = pos == 0 ? 0 : ckpts[pos - 1].votes;
        newWeight = op(oldWeight, delta);

        if (pos > 0 && ckpts[pos - 1].fromBlock == block.number) {
            ckpts[pos - 1].votes = SafeCast.toUint224(newWeight);
        } else {
            ckpts.push(
                Checkpoint({
                    fromBlock: SafeCast.toUint32(block.number),
                    votes: SafeCast.toUint224(newWeight)
                })
            );
        }
    }

    /**
     * @dev Helper addition function for passing to checkpointing functions.
     */
    function _add(uint256 a, uint256 b) private pure returns (uint256) {
        return a + b;
    }

    /**
     * @dev Helper subtraction function for passing to checkpointing functions.
     */
    function _subtract(uint256 a, uint256 b) private pure returns (uint256) {
        return a - b;
    }
}
