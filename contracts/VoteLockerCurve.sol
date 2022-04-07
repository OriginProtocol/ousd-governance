// SPDX-License-Identifier: MIT

// Inspired by the Curve.fi VotingEscrow contract and the mStable Solidity fork.
//    - Adds compatability with the OpenZeppelin governance stack (4.5.0)
//    - Removes the separate lockup amount and lockup duration extension functions info
//      favour of a single function for create or update.
//    - Adds an deprecate mechanism for removing all voting power and allowing users too
//      withdraw lockups
//
// References:
//   - https://github.com/curvefi/curve-dao-contracts/blob/master/contracts/VotingEscrow.vy
//   - https://github.com/mstable/mStable-contracts/blob/master/contracts/governance/IncentivisedVotingLockup.sol

pragma solidity ^0.8.4;

import "./GroupVoteLocker.sol";
import "OpenZeppelin/openzeppelin-contracts@02fcc75bb7f35376c22def91b0fb9bc7a50b9458/contracts/token/ERC20/ERC20.sol";
import "OpenZeppelin/openzeppelin-contracts@02fcc75bb7f35376c22def91b0fb9bc7a50b9458/contracts/token/ERC20/utils/SafeERC20.sol";
import "OpenZeppelin/openzeppelin-contracts-upgradeable@a16f26a063cd018c4c986832c3df332a131f53b9/contracts/access/OwnableUpgradeable.sol";
import "OpenZeppelin/openzeppelin-contracts-upgradeable@a16f26a063cd018c4c986832c3df332a131f53b9/contracts/proxy/utils/Initializable.sol";
import "OpenZeppelin/openzeppelin-contracts-upgradeable@a16f26a063cd018c4c986832c3df332a131f53b9/contracts/proxy/utils/UUPSUpgradeable.sol";

contract VoteLockerCurve is Initializable, OwnableUpgradeable, UUPSUpgradeable, GroupVoteLocker  {
    using SafeERC20 for ERC20;

    ///@notice Emitted when a lockup is created
    event LockupCreated(
        address indexed provider,
        int128 amount,
        uint256 end,
        uint256 ts
    );
    ///@notice Emitted when an existing lockup is changed
    event LockupUpdated(
        address indexed provider,
        int128 oldAmount,
        uint256 oldEnd,
        int128 amount,
        uint256 end,
        uint256 ts
    );
    ///@notice Emitted when a user withdraws from an expired lockup
    event Withdraw(address indexed provider, uint256 value, uint256 ts);

    ///@notice Emitted when an account changes their delegate.
    event DelegateChanged(address indexed delegator, address indexed fromDelegate, address indexed toDelegate);

    ///@notice ERC20 parameters
    string private _name;
    string private _symbol;
    uint8 private _decimals;

    /*
     * Voting power of locked tokens decreases over time in linear fashion. And can be represented
     * by the initial (at the lock time) voting power (bias) and decrease rate (slope), at some point in time
     * (block number / timestamp). Structure holding that information is called a Checkpoint (user
     * checkpoint more accurately - represented by Alice/Bob function below).
     *
     * When trying to determine the voting power of all accounts at some point in time (e.g. when fetching
     * total supply) it wouldn't be gas cost effective to loop over all accounts and fetch their voting
     * power. For that reason we maintain a combined voting power of all users (represented by the Global
     * function below). The function is represented by a combination of a Checkpoint structure and multiple slope
     * changes. Slope changes mark when a voting power of one or more users reaches zero since that
     * is the moment when combined function slope becomes less steep.
     *
     * Each time a global checkpoint is created it takes into account the previous global checkpoint, all
     * slope changes that happened since then and (user) the change that triggered the global checkpoint creation.
     * This way a Checkpoint structure (bias + slope + time) correctly represents the state of the global
     * voting power amount at the time of its creation. A collection of future slope changes compliments that
     * Checkpoint and defines a global voting power function.

      Alice:
      ~~~~~~~
      ^
      |     *
      |     |  \ - normal slope
      |     |    \ - normal slope
      +-+---+---+--+--+-> t

      Bob:
      ~~~~~~~
      ^
      |         *
      |         |  \ - normal slope
      |         |    \ - normal slope
      +-+---+---+--+--+-> t

      Global: (Bob & Alice combined):
      ~~~~~~~
      ^
      |         *
      |     *   | ＼ - steeper slope (Alice + Bob slope)
      |     |  \|  \ - normal slope (Bob slope)
      |     |   |    \ - normal slope
      +-+---+---+--+--+-> t
    */

    ///@notice Per user Checkpoints defining voting power of each user
    mapping(address => Checkpoint[]) private _userCheckpoints;
    ///@notice userEpoch important for fetching previous block per user voting power
    mapping(address => uint256) public userEpoch;

    ///@notice Lockup mapping for each user
    mapping(address => Lockup) public lockups;

    ///@notice Contains group vote information used for totalSupply & totalSupplyAt
    GroupVotePowerState public totalVotes;

    mapping(address => GroupVotePowerState) public userTotalVotesWithDelegation;

    /// @notice Delegation mapping where delegator is key and delegatee is value
    mapping(address => address) private _delegations;

    ///@notice Token that is locked up in return for vote escrowed token
    ERC20 stakingToken;

    ///@custom:oz-upgrades-unsafe-allow constructor
    constructor() initializer {}

    function initialize(address _stakingToken) public initializer {
        __Ownable_init();
        __UUPSUpgradeable_init();

        stakingToken = ERC20(_stakingToken);

        // Derive the name and symbol from the staking token
        _name = string(
            bytes.concat(bytes("Vote Locked"), " ", bytes(stakingToken.name()))
        );
        _symbol = string(
            bytes.concat(bytes("vl"), bytes(stakingToken.symbol()))
        );
        // Use the same decimals as the staking token
        _decimals = stakingToken.decimals();
    }

    /**
     * @dev Returns the name of the token.
     * @return string memory Token name
     */
    function name() public view virtual returns (string memory) {
        return _name;
    }

    /**
     * @dev Returns the symbol of the token, usually a shorter version of the
     * name.
     * @return string memory Token symbol
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
     * @return uint8 Token decimals
     */
    function decimals() public view virtual returns (uint8) {
        return _decimals;
    }

    /**
     * @dev See {ERC20-balanceOf}.
     */
    function balanceOf(address _account) public view returns (uint256) {
        return totalVotePower(userTotalVotesWithDelegation[_account]);
    }

    /**
     * Function considers voting power only from token lockup - user Checkpoints. Ignoring
     * delegation.
     */
    function _balanceOfAccount(address _account) internal returns (uint256) {
        uint256 currentUserEpoch = userEpoch[_account];
        if (currentUserEpoch == 0) {
            return 0;
        }
        Checkpoint memory lastCheckpoint = _userCheckpoints[_account][
            currentUserEpoch
        ];

        // Calculate the bias based on the last bias and the slope over the difference
        // in time between the last checkpint timestamp and the current block timestamp;
        return SafeCast.toUint256(_decayCheckpointBias(lastCheckpoint, block.timestamp));
    }

    /**
     * @dev Reduce the checkpoint bias according to its slope and the time that has passed
     * from the checkpoint creation to the `_timestamp` timestamp
     */
    function _decayCheckpointBias(Checkpoint memory _checkpoint, uint256 _timestamp)
        internal returns (int128)
    {
        int128 bias = _checkpoint.bias - (_checkpoint.slope *
            SafeCast.toInt128(int256(_timestamp - _checkpoint.ts)));
        return SafeCast.toInt128(max(bias, 0));
    }

    /**
     * @dev See {ERC20-totalSupply}.
     */
    function totalSupply() public view returns (uint256) {
        return totalVotePower(totalVotes);
    }

    /**
     * @dev Get the `pos`-th checkpoint for `_account`.
     * @return Checkpoint memory
     */
    function checkpoints(address _account, uint32 _pos)
        public
        view
        virtual
        returns (Checkpoint memory)
    {
        return _userCheckpoints[_account][_pos];
    }

    /**
     * @dev Get the number of checkpoints for `_account`.
     * @return uint32
     */
    function numCheckpoints(address _account)
        public
        view
        virtual
        returns (uint256)
    {
        return _userCheckpoints[_account].length;
    }

    /**
     * @dev Get last checkpoint for `_account`
     */
    function getLastCheckpoint(address _account)
        public
        view
        returns (Checkpoint memory _checkpoint)
    {
        
        _checkpoint = _userCheckpoints[_account][_userCheckpoints[_account].length - 1];
    }

    /**
     * @dev Get the `pos`-th global checkpoint.
     * @return Checkpoint memory
     */
    function globalCheckpoints(uint32 pos)
        public
        view
        returns (Checkpoint memory)
    {
        return totalVotes.checkpoints[pos];
    }

    /**
     * @dev Get number of global checkpoints.
     * @return uint256
     */
    function numGlobalCheckpoints() public view returns (uint256) {
        return totalVotes.checkpoints.length;
    }

    /**
     * @dev Get the last global checkpoint.
     * @return Checkpoint memory
     */
    function getLastGlobalCheckpoint() public view returns (Checkpoint memory) {
        return totalVotes.checkpoints[totalVotes.checkpoints.length - 1];
    }

    /**
     * @dev Gets the current votes balance for `_account`
     * This method is required for compatibility with the OpenZeppelin governance ERC20Votes.
     * @param _account Account to get the votes balance for
     * @return uint256 Current votes balance for `_account`
     */
    function getVotes(address _account) public view returns (uint256) {
        return balanceOf(_account);
    }

    /**
     * @dev Gets the current lockup for `_account`
     */
    function getLockup(address _account) public view returns (Lockup memory) {
        return lockups[_account];
    }

    /**
     * @dev Get the address `_account` is currently delegating to.
     */
    function delegates(address _account)
        public
        view
        virtual
        returns (address)
    {
        return _delegations[_account];
    }

    /**
     * @dev Delegate votes from the sender to `delegatee`.
     */
    function delegate(address delegatee) public virtual {
        address currentDelegatee = _delegations[msg.sender];
        uint256 votingPower = _balanceOfAccount(msg.sender);
        _delegations[msg.sender] = delegatee;
        Lockup memory lastLockup = lockups[msg.sender];

        // use currently has 0 voting power nothing else to do here
        if (votingPower == 0 || lastLockup.end < block.timestamp) {
            return;
        }
        // checkpoint exists since votingPower > 0
        Checkpoint memory lastCheckpoint = getLastCheckpoint(msg.sender);
        int128 decayedBias = _decayCheckpointBias(lastCheckpoint, block.timestamp);

        // take away voting power from current delegatee or user itself
        _writeGroupCheckpoint(
            -lastCheckpoint.slope,
            -decayedBias,
            userTotalVotesWithDelegation[currentDelegatee != address(0) ? currentDelegatee : msg.sender]
        );
        // add voting power to new delegatee or user itself
        _writeGroupCheckpoint(
            lastCheckpoint.slope,
            decayedBias,
            userTotalVotesWithDelegation[delegatee != address(0) ? delegatee : msg.sender]
        );
    }

    /**
     * @dev Delegates votes from signer to `delegatee`
     */
    function delegateBySig(
        address delegatee,
        uint256 nonce,
        uint256 end,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public virtual {
        revert("Delegation by signature is not supported");
    }

    /**
     * @dev Deposits staking token and mints new veTokens according to the lockup length
     * @param _amount Amount of staking token to deposit
     * @param _end Lockup end time
     */
    function lockup(uint256 _amount, uint256 _end) public virtual {
        // end is rounded down to week time resolution
        _end = _floorToWeek(_end);

        Lockup memory oldLockup = lockups[msg.sender];

        require(
            _end > block.timestamp,
            "End must be greater than the current block timestamp"
        );
        if (oldLockup.end > 0 && _end < oldLockup.end) {
            revert("End must be greater than or equal to the current end");
        }
        // This is not an extension of an existing lockup, validate end
        require(
            _end - block.timestamp <= MAX_LOCK_TIME,
            "End must be before maximum lockup time"
        );
        int128 amount = SafeCast.toInt128(int256(_amount));
        // Amount extensions
        require(
            amount >= oldLockup.amount,
            "Amount must be greater than or equal to current amount"
        );

        // oldLockup.amount is 0 if no lockup, or something if this is an increase in locked
        // amount
        uint256 amountDelta = SafeCast.toUint256(amount - oldLockup.amount);

        // Old lockup amount will be 0 if no existing lockup, if this is an increase of the
        // lockup amount, then _amount can be 0
        Lockup memory newLockup = Lockup({amount: amount, end: _end});

        lockups[msg.sender] = newLockup;

        if (amountDelta > 0) {
            // Transfer the amount delta
            stakingToken.safeTransferFrom(
                msg.sender,
                address(this),
                amountDelta
            );
        }

        if (oldLockup.end > 0) {
            // This is an extension of an existing lockup
            emit LockupUpdated(
                msg.sender,
                oldLockup.amount,
                oldLockup.end,
                newLockup.amount,
                newLockup.end,
                block.timestamp
            );
        } else {
            emit LockupCreated(
                msg.sender,
                newLockup.amount,
                newLockup.end,
                block.timestamp
            );
        }

        _writeUserCheckpoint(msg.sender, oldLockup, newLockup);
    }

    /**
     * @dev Withdraw all tokens from an expired lockup.
     */
    function withdraw() public {
        Lockup memory oldLockup = Lockup({
            end: lockups[msg.sender].end,
            amount: lockups[msg.sender].amount
        });
        require(
            block.timestamp >= oldLockup.end,
            "Lockup must be expired"
        );

        require(oldLockup.amount > 0, "Lockup has no tokens");

        Lockup memory newLockup = Lockup({end: 0, amount: 0});
        lockups[msg.sender] = newLockup;

        uint256 amount = SafeCast.toUint256(oldLockup.amount);

        stakingToken.safeTransfer(msg.sender, amount);

        _writeUserCheckpoint(msg.sender, oldLockup, newLockup);

        emit Withdraw(msg.sender, amount, block.timestamp);
    }

    /**
     * @dev Public function to trigger global checkpoint.
     */
    function checkpoint() external {
        _writeGroupCheckpoint(0, 0, totalVotes);
    }

    /**
     * @dev Write user checkpoint. User checkpoints are used to calculate the
     * users vote balance for current and historical blocks.
     * @param _oldLockup Users lockup prior to the change that triggered the checkpoint
     * @param _newLockup Users new lockup
     */
    function _writeUserCheckpoint(
        address _account,
        Lockup memory _oldLockup,
        Lockup memory _newLockup
    ) private {
        Checkpoint memory oldCheckpoint = _lockupToCheckpoint(_oldLockup);
        Checkpoint memory newCheckpoint = _lockupToCheckpoint(_newLockup);

        uint256 userCurrentEpoch = userEpoch[_account];
        if (userCurrentEpoch == 0) {
            // First user epoch, push first checkpoint
            _userCheckpoints[_account].push(oldCheckpoint);
        }

        userEpoch[_account] = userCurrentEpoch + 1;

        newCheckpoint.ts = block.timestamp;
        newCheckpoint.blk = block.number;
        // Push second checkpoint
        _userCheckpoints[_account].push(newCheckpoint);
        // Update total supply group state
        _updateGroupState(_oldLockup, _newLockup, oldCheckpoint, newCheckpoint, totalVotes);

        // Update delegation included group state
        _updateGroupState(
            _oldLockup,
            _newLockup,
            oldCheckpoint,
            newCheckpoint,
            userTotalVotesWithDelegation[_delegations[_account] != address(0) ? _delegations[_account] : msg.sender]
        );
    }

    /**
     * Convert lockup data to a checkpoint
     */
    function _lockupToCheckpoint(Lockup memory _lockup)
        private
        returns (Checkpoint memory _checkpoint)
    {
        if (_lockup.end > block.timestamp && _lockup.amount > 0) {
            // Checkpoint still active, calculates its slope and bias
            _checkpoint.slope =
                _lockup.amount /
                SafeCast.toInt128(int256(MAX_LOCK_TIME));
            _checkpoint.bias =
                _checkpoint.slope *
                SafeCast.toInt128(int256(_lockup.end - block.timestamp));
        }
    }

    /**
     * @dev Retrieve the number of votes for `_account` at the end of `_blockNumber`.
     *
     * This method is required for compatibility with the OpenZeppelin governance ERC20Votes.
     *
     * Requirements:
     *
     * - `blockNumber` must have been already mined
     */
    function getPastVotes(address _account, uint256 _blockNumber)
        public
        view
        returns (uint256)
    {
        return balanceOfAt(_account, _blockNumber);
    }

    /**
     * @dev Gets a users votingWeight at a given blockNumber including delegation
     * @param _account address for which voting power balance is returned
     * @param _blockNumber block number at which to query the _account's voting power
     */
    function balanceOfAt(address _account, uint256 _blockNumber)
        public
        view
        returns (uint256)
    {
        return totalVotePowerAt(userTotalVotesWithDelegation[_account], _blockNumber);
    }

    /**
     * @dev Gets a users votingWeight at a given blockNumber, ignores delegation
     * @param _account User for which to return the balance
     * @param _blockNumber Block at which to calculate balance
     * @return uint256 Balance of user voting power.
     */
    function balanceOfAtAccount(address _account, uint256 _blockNumber)
        public
        view
        returns (uint256)
    {
        require(_blockNumber <= block.number, "Block number is in the future");

        // Get most recent user Checkpoint to block
        uint256 recentUserEpoch = _findEpoch(
            _userCheckpoints[_account],
            _blockNumber,
            userEpoch[_account] // Max epoch
        );
        if (recentUserEpoch == 0) {
            return 0;
        }
        Checkpoint memory userPoint = _userCheckpoints[_account][
            recentUserEpoch
        ];

        // Get most recent global Checkpoint to block
        uint256 recentGlobalEpoch = _findEpoch(
            totalVotes.checkpoints,
            _blockNumber,
            totalVotes.epoch // Max epoch
        );
        Checkpoint memory checkpoint0 = totalVotes.checkpoints[recentGlobalEpoch];

        // Calculate delta (block & time) between checkpoint and target block
        // Allowing us to calculate the average seconds per block between
        // the two points
        uint256 dBlock = 0;
        uint256 dTime = 0;
        if (recentGlobalEpoch < totalVotes.epoch) {
            Checkpoint memory checkpoint1 = totalVotes.checkpoints[
                recentGlobalEpoch + 1
            ];
            dBlock = checkpoint1.blk - checkpoint0.blk;
            dTime = checkpoint1.ts - checkpoint0.ts;
        } else {
            dBlock = block.number - checkpoint0.blk;
            dTime = block.timestamp - checkpoint0.ts;
        }

        // (Deterministically) Estimate the time at which block _blockNumber was mined
        uint256 blockTime = checkpoint0.ts;
        if (dBlock != 0) {
            blockTime += (dTime * (_blockNumber - checkpoint0.blk)) / dBlock;
        }

        // Current Bias = most recent bias - (slope * time since update)
        userPoint.bias -= (userPoint.slope *
            SafeCast.toInt128(int256(blockTime - userPoint.ts)));
        
        return SafeCast.toUint256(max(userPoint.bias, 0));
    }

    /**
     * @dev Retrieve the `totalSupply` at the end of `blockNumber`.
     *
     * This method is required for compatibility with the OpenZeppelin governance ERC20Votes.
     *
     * Requirements:
     *
     * - `_blockNumber` must have been already mined
     *
     * @param _blockNumber Block at which to calculate total supply
     * @return uint256 Total supply at the given block
     */
    function getPastTotalSupply(uint256 _blockNumber)
        public
        view
        returns (uint256)
    {
        return totalSupplyAt(_blockNumber);
    }

    /**
     * @dev Calculates total supply of votingWeight at a given blockNumber
     * @param _blockNumber Block number at which to calculate total supply
     * @return totalSupply of voting token weight at the given blockNumber
     */
    function totalSupplyAt(uint256 _blockNumber) public view returns (uint256) {
        return totalVotePowerAt(totalVotes, _blockNumber);
    }

    /**
     * @dev Calculates total supply of votingWeight at a given time _t
     * @param _checkpoint Most recent point before time _t
     * @param _time Time at which to calculate supply
     * @return totalSupply at given time
     */
    function _supplyAt(Checkpoint memory _checkpoint, uint256 _time)
        internal
        view
        returns (uint256)
    {
        return _votePowerAt(totalVotes, _checkpoint, _time);
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyOwner
    {}
}
