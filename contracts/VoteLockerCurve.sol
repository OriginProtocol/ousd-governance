// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "OpenZeppelin/openzeppelin-contracts@4.5.0/contracts/token/ERC20/ERC20.sol";
import "OpenZeppelin/openzeppelin-contracts@4.5.0/contracts/utils/math/SafeCast.sol";
import "OpenZeppelin/openzeppelin-contracts@4.5.0/contracts/token/ERC20/utils/SafeERC20.sol";
import "OpenZeppelin/openzeppelin-contracts@4.5.0/contracts/utils/Strings.sol";

contract VoteLockerCurve {
    using SafeERC20 for ERC20;

    event Deposit(
        address indexed provider,
        uint256 amount,
        uint256 locktime,
        uint256 ts
    );
    event Withdraw(address indexed provider, uint256 value, uint256 ts);

    ///@notice ERC20 parameters
    string private _name;
    string private _symbol;
    uint8 private _decimals;

    uint256 private constant WEEK = 7 days;
    /// @notice Maximum lock time
    uint256 public constant MAX_LOCK_TIME = 4 * 365 * 86400; // 4 years
    /// @notice Vote boost if locked for maximum duration
    uint256 public constant MAX_VOTE_MULTIPLE = 4;
    /// @notice Checkpoints for each user
    mapping(address => Checkpoint[]) private _userCheckpoints;
    mapping(address => uint256) public userEpoch;
    /// @notice Global checkpoints
    Checkpoint[] private _globalCheckpoints;
    uint256 public globalEpoch;
    /// @notice Lockup mapping for each user
    mapping(address => Lockup) public lockups;
    /// @notice
    mapping(uint256 => int128) public slopeChanges;

    ERC20 stakingToken;

    struct Checkpoint {
        int128 bias;
        int128 slope;
        uint256 ts;
        uint256 blk;
    }

    struct Lockup {
        int128 amount;
        uint256 end;
    }

    constructor(address _stakingToken) {
        stakingToken = ERC20(_stakingToken);
        _name = string(
            bytes.concat(bytes("Vote Locked"), " ", bytes(stakingToken.name()))
        );
        _symbol = string(
            bytes.concat(bytes("vl"), bytes(stakingToken.symbol()))
        );
        _decimals = stakingToken.decimals();
        // Push an initial global checkpoint
        _globalCheckpoints.push(
            Checkpoint({
                bias: 0,
                slope: 0,
                ts: block.timestamp,
                blk: block.number
            })
        );
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
     * @dev See {ERC20-balanceOf}.
     */
    function balanceOf(address _account) public view returns (uint256) {
        return getVotes(_account);
    }

    /**
     * @dev See {ERC20-totalSupply}.
     */
    function totalSupply() public view returns (uint256) {
        if (_globalCheckpoints.length == 0) {
            return 0;
        }
        Checkpoint memory lastCheckpoint = _globalCheckpoints[globalEpoch];
        return _supplyAt(lastCheckpoint, block.timestamp);
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
        return _userCheckpoints[account][pos];
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
        return SafeCast.toUint32(_userCheckpoints[account].length);
    }

    /**
     * @dev Get the `pos`-th global checkpoint.
     */
    function globalCheckpoints(uint32 pos)
        public
        view
        returns (Checkpoint memory)
    {
        return _globalCheckpoints[pos];
    }

    /**
     * @dev Get number of global checkpoints.
     */
    function numGlobalCheckpoints() public view returns (uint256) {
        return _globalCheckpoints.length;
    }

    /**
     * @dev Gets the current votes balance for `_address`
     */
    function getVotes(address _address) public view returns (uint256) {
        uint256 currentUserEpoch = userEpoch[_address];
        if (currentUserEpoch == 0) {
            return 0;
        }
        Checkpoint memory lastCheckpoint = _userCheckpoints[_address][
            currentUserEpoch
        ];
        // Calculate the bias based on the last bias and the slope over the difference
        // in time between the last checkpint timestamp and the current block timetamp;
        lastCheckpoint.bias =
            lastCheckpoint.bias -
            (lastCheckpoint.slope *
                SafeCast.toInt128(int256(block.timestamp - lastCheckpoint.ts)));
        return SafeCast.toUint256(max(lastCheckpoint.bias, 0));
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
        return _userCheckpointsLookup(_userCheckpoints[account], blockNumber);
    }

    /**
     * @dev Retrieve the `totalSupply` at the end of `blockNumber`. Note, this value is the sum of all balances.
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
        return _userCheckpointsLookup(_globalCheckpoints, blockNumber);
    }

    /**
     * @dev Lookup a value in a list of (sorted) checkpoints.
     */
    function _userCheckpointsLookup(
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
    }

    /**
     * @dev Get the address `account` is currently delegating to.
     */
    function delegates(address account) public view virtual returns (address) {
        // Contract does not support delegation
    }

    /**
     * @dev Delegate votes from the sender to `delegatee`.
     */
    function delegate(address delegatee) public virtual {
        revert("Delegation is not supported");
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
     * @dev Deposits staking token and mints new tokens according to the MAX_VOTE_MULTIPLE and _end parameters.
     */
    function upsertLockup(uint256 _amount, uint256 _end) public virtual {
        // end is rounded down to week
        _end = _floorToWeek(_end);

        Lockup memory oldLockup = lockups[msg.sender];

        if (oldLockup.end > 0 && _end < oldLockup.end) {
            revert("End must be greater than or equal to the current end");
        }

        // This is not an extension of an existing lockup, validate end
        require(
            _end - block.timestamp <= MAX_LOCK_TIME,
            "End must be before maximum lockup time"
        );

        // Old lockup amount will be 0 if no existing lockup, if this is an increase of the
        // lockup amount, then _amount can be 0
        Lockup memory newLockup = Lockup({
            amount: oldLockup.amount + SafeCast.toInt128(int256(_amount)),
            end: _end
        });

        lockups[msg.sender] = newLockup;

        if (_amount != 0) {
            stakingToken.safeTransferFrom(msg.sender, address(this), _amount);
        }

        _writeUserCheckpoint(msg.sender, oldLockup, newLockup);
    }

    /**
     * @dev Withdraw tokens from an expired lockup.
     */
    function withdraw() public {
        Lockup memory oldLockup = Lockup({
            end: lockups[msg.sender].end,
            amount: lockups[msg.sender].amount
        });
        require(
            block.timestamp >= oldLockup.end,
            string(
                bytes.concat(
                    bytes("Lockup expires at "),
                    bytes(Strings.toString(oldLockup.end)),
                    bytes(", now is "),
                    bytes(Strings.toString(block.timestamp))
                )
            )
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
     * @dev Public function to trigger global checkpoint
     */
    function checkpoint() external {
        _writeGlobalCheckpoint();
    }

    /**
     *
     */
    function _writeUserCheckpoint(
        address _address,
        Lockup memory _oldLockup,
        Lockup memory _newLockup
    ) private returns (uint256 oldWeight, uint256 newWeight) {
        Checkpoint memory oldCheckpoint;
        Checkpoint memory newCheckpoint;

        int128 oldSlopeDelta = 0;
        int128 newSlopeDelta = 0;

        if (_oldLockup.end > block.timestamp && _oldLockup.amount > 0) {
            oldCheckpoint.slope =
                _oldLockup.amount /
                SafeCast.toInt128(int256(MAX_LOCK_TIME));
            oldCheckpoint.bias =
                oldCheckpoint.slope *
                SafeCast.toInt128(int256(_oldLockup.end - block.timestamp));
        }
        if (_newLockup.end > block.timestamp && _newLockup.amount > 0) {
            newCheckpoint.slope =
                _newLockup.amount /
                SafeCast.toInt128(int256(MAX_LOCK_TIME));
            newCheckpoint.bias =
                newCheckpoint.slope *
                SafeCast.toInt128(int256(_newLockup.end - block.timestamp));
        }

        uint256 userCurrentEpoch = userEpoch[_address];
        if (userCurrentEpoch == 0) {
            _userCheckpoints[_address].push(oldCheckpoint);
        }

        newCheckpoint.ts = block.timestamp;
        newCheckpoint.blk = block.number;
        userEpoch[_address] = userCurrentEpoch + 1;
        _userCheckpoints[_address].push(newCheckpoint);

        oldSlopeDelta = slopeChanges[_oldLockup.end];
        if (_newLockup.end != 0) {
            if (_newLockup.end == _oldLockup.end) {
                newSlopeDelta = oldSlopeDelta;
            } else {
                newSlopeDelta = slopeChanges[_newLockup.end];
            }
        }

        Checkpoint memory lastCheckpoint;

        (lastCheckpoint, ) = _writeGlobalCheckpoint();

        lastCheckpoint.slope = max(
            lastCheckpoint.slope + newCheckpoint.slope - oldCheckpoint.slope,
            0
        );

        lastCheckpoint.bias = max(
            lastCheckpoint.bias + newCheckpoint.bias - oldCheckpoint.bias,
            0
        );

        _globalCheckpoints.push(lastCheckpoint);

        // Schedule the slope changes
        if (_oldLockup.end > block.timestamp) {
            // Old lockup has not expired yet, so this is an adjustment of the slope
            // oldSlopeDelta was <something> - oldCheckpoint.slope, so we cancel that
            oldSlopeDelta = oldSlopeDelta + oldCheckpoint.slope;
            if (_newLockup.end == _oldLockup.end) {
                // It was a new deposit, not extension
                oldSlopeDelta = oldSlopeDelta - newCheckpoint.slope;
            }
            slopeChanges[_oldLockup.end] = oldSlopeDelta;
        }

        if (_newLockup.end > block.timestamp) {
            if (_newLockup.end > _oldLockup.end) {
                newSlopeDelta = newSlopeDelta - newCheckpoint.slope; // old slope disappeared at this point
                slopeChanges[_newLockup.end] = newSlopeDelta;
            }
        }
    }

    /**
     *
     */
    function _writeGlobalCheckpoint()
        private
        returns (
            Checkpoint memory lastCheckpoint,
            Checkpoint memory initialLastCheckpoint
        )
    {
        if (globalEpoch > 0) {
            lastCheckpoint = _globalCheckpoints[globalEpoch];
        } else {
            lastCheckpoint = Checkpoint({
                bias: 0,
                slope: 0,
                ts: block.timestamp,
                blk: block.number
            });
        }

        uint256 lastCheckpointTimestamp = lastCheckpoint.ts;

        initialLastCheckpoint = Checkpoint({
            bias: 0,
            slope: 0,
            ts: lastCheckpoint.ts,
            blk: lastCheckpoint.blk
        });

        uint256 blockSlope = 0; // dblock/dt
        if (block.timestamp > lastCheckpointTimestamp) {
            blockSlope =
                ((block.number - lastCheckpoint.blk) * 1**18) /
                (block.timestamp - lastCheckpointTimestamp);
        }

        // blockSlope will be 0 if block.timestamp == lastCheckpointTimestamp

        uint256 iterativeTime = _floorToWeek(lastCheckpointTimestamp);

        for (uint256 i = 0; i < 255; i++) {
            // 5 years
            iterativeTime = iterativeTime + WEEK;

            int128 slopeDelta = 0;
            if (iterativeTime > block.timestamp) {
                // Current epoch
                iterativeTime = block.timestamp;
            } else {
                slopeDelta = slopeChanges[iterativeTime];
            }

            // Calculate the change in bias for the current epoch
            int128 biasDelta = lastCheckpoint.slope *
                SafeCast.toInt128(
                    int256((iterativeTime - lastCheckpointTimestamp))
                );

            // The bias can be below 0
            lastCheckpoint.bias = max(lastCheckpoint.bias - biasDelta, 0);
            // The slope should never be below 0 but added for safety
            lastCheckpoint.slope = max(lastCheckpoint.slope + slopeDelta, 0);
            lastCheckpoint.ts = iterativeTime;
            lastCheckpoint.blk =
                initialLastCheckpoint.blk +
                ((blockSlope * (iterativeTime - initialLastCheckpoint.ts)) /
                    1) *
                10**18;

            globalEpoch = globalEpoch + 1;
            if (iterativeTime == block.timestamp) {
                lastCheckpoint.blk = block.number;
                break;
            } else {
                _globalCheckpoints.push(lastCheckpoint);
            }
        }

        return (lastCheckpoint, initialLastCheckpoint);
    }

    /**
     * @dev Calculates total supply of votingWeight at a given time _t
     * @param _checkpoint Most recent point before time _t
     * @param _time Time at which to calculate supply
     * @return totalSupply at given point in time
     */
    function _supplyAt(Checkpoint memory _checkpoint, uint256 _time)
        internal
        view
        returns (uint256)
    {
        Checkpoint memory lastCheckpoint = _checkpoint;

        // Floor the timestamp to weekly interval
        uint256 iterativeTime = _floorToWeek(lastCheckpoint.ts);
        // Iterate through all weeks between _checkpoint & _time to account for slope changes
        for (uint256 i = 0; i < 255; i++) {
            iterativeTime = iterativeTime + WEEK;
            int128 dSlope = 0;
            // If week end is after timestamp, then truncate & leave dSlope to 0
            if (iterativeTime > _time) {
                iterativeTime = _time;
            }
            // else get most recent slope change
            else {
                dSlope = slopeChanges[iterativeTime];
            }

            lastCheckpoint.bias =
                lastCheckpoint.bias -
                (lastCheckpoint.slope *
                    SafeCast.toInt128(
                        int256(iterativeTime - lastCheckpoint.ts)
                    ));

            if (iterativeTime == _time) {
                break;
            }

            lastCheckpoint.slope = lastCheckpoint.slope + dSlope;
            lastCheckpoint.ts = iterativeTime;
        }

        return SafeCast.toUint256(max(lastCheckpoint.bias, 0));
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

    /**
     * @dev Floors a timestamp to the nearest weekly increment
     */
    function _floorToWeek(uint256 _t) internal pure returns (uint256) {
        return (_t / WEEK) * WEEK;
    }

    /**
     * @dev Returns the largest of two numbers.
     */
    function max(uint256 a, uint256 b) internal pure returns (uint256) {
        return a >= b ? a : b;
    }

    /**
     * @dev Returns the largest of two numbers.
     */
    function max(int128 a, int128 b) internal pure returns (int128) {
        return a >= b ? a : b;
    }
}
