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

import "OpenZeppelin/openzeppelin-contracts@02fcc75bb7f35376c22def91b0fb9bc7a50b9458/contracts/token/ERC20/ERC20.sol";
import "OpenZeppelin/openzeppelin-contracts@02fcc75bb7f35376c22def91b0fb9bc7a50b9458/contracts/utils/math/SafeCast.sol";
import "OpenZeppelin/openzeppelin-contracts@02fcc75bb7f35376c22def91b0fb9bc7a50b9458/contracts/token/ERC20/utils/SafeERC20.sol";
import "OpenZeppelin/openzeppelin-contracts@02fcc75bb7f35376c22def91b0fb9bc7a50b9458/contracts/utils/Strings.sol";
import "OpenZeppelin/openzeppelin-contracts-upgradeable@a16f26a063cd018c4c986832c3df332a131f53b9/contracts/access/OwnableUpgradeable.sol";
import "OpenZeppelin/openzeppelin-contracts-upgradeable@a16f26a063cd018c4c986832c3df332a131f53b9/contracts/proxy/utils/Initializable.sol";
import "OpenZeppelin/openzeppelin-contracts-upgradeable@a16f26a063cd018c4c986832c3df332a131f53b9/contracts/proxy/utils/UUPSUpgradeable.sol";

contract VoteLockerCurve is Initializable, OwnableUpgradeable, UUPSUpgradeable {
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

    ///@notice ERC20 parameters
    string private _name;
    string private _symbol;
    uint8 private _decimals;

    ///@notice Definition of a week
    uint256 private constant WEEK = 7 days;
    ///@notice Maximum lock time
    uint256 public constant MAX_LOCK_TIME = 4 * 365 * 86400; // 4 years

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

    /* @notice Global Checkpoints part of the equation to define combined voting
     * power of all users.
     */
    Checkpoint[] private _globalCheckpoints;
    ///@notice globalEpoch important for fetching previous block combined voting power
    uint256 public globalEpoch;

    ///@notice Lockup mapping for each user
    mapping(address => Lockup) public lockups;

    /* @notice slopeChanges part of the equation to define combined voting power of
     * all users. Slope changes always complement only the latest global Checkpoint and are
     * not used when fetching combined voting power of previous blocks.
     */
    mapping(uint256 => int128) public slopeChanges;

    ///@notice Token that is locked up in return for vote escrowed token
    ERC20 stakingToken;

    ///@notice Checkpoint structure representing linear voting power decay
    struct Checkpoint {
        int128 bias;
        int128 slope;
        uint256 ts;
        uint256 blk;
    }

    ///@notice Stores token lockup details
    struct Lockup {
        int128 amount;
        uint256 end;
    }

    ///@custom:oz-upgrades-unsafe-allow constructor
    constructor() initializer {}

    function initialize(address _stakingToken) public initializer {
        __Ownable_init();
        __UUPSUpgradeable_init();

        setStakingToken(_stakingToken);

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
     * @notice Sets the staking token
     * @param _stakingToken Token that is locked up in return for vote escrowed token
     */
    function setStakingToken(address _stakingToken) public onlyOwner {
        stakingToken = ERC20(_stakingToken);
        // Derive the name and symbol from the staking token
        _name = string(
            bytes.concat(bytes("Vote Escrowed"), " ", bytes(stakingToken.name()))
        );
        _symbol = string(
            bytes.concat(bytes("ve"), bytes(stakingToken.symbol()))
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
        uint256 currentUserEpoch = userEpoch[_account];
        if (currentUserEpoch == 0) {
            return 0;
        }
        Checkpoint memory lastCheckpoint = _userCheckpoints[_account][
            currentUserEpoch
        ];
        // Calculate the bias based on the last bias and the slope over the difference
        // in time between the last checkpint timestamp and the current block timestamp;
        lastCheckpoint.bias -= (lastCheckpoint.slope *
            SafeCast.toInt128(int256(block.timestamp - lastCheckpoint.ts)));
        return SafeCast.toUint256(max(lastCheckpoint.bias, 0));
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
     * @dev Get last checkpoint for `_account`.
     * @return Checkpoint memory
     */
    function getLastCheckpoint(address _account)
        public
        view
        returns (Checkpoint memory)
    {
        return
            _userCheckpoints[_account][_userCheckpoints[_account].length - 1];
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
        return _globalCheckpoints[pos];
    }

    /**
     * @dev Get number of global checkpoints.
     * @return uint256
     */
    function numGlobalCheckpoints() public view returns (uint256) {
        return _globalCheckpoints.length;
    }

    /**
     * @dev Get the last global checkpoint.
     * @return Checkpoint memory
     */
    function getLastGlobalCheckpoint() public view returns (Checkpoint memory) {
        return _globalCheckpoints[_globalCheckpoints.length - 1];
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
    {}

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
        // New lockups cannot be for zero tokens
        require(oldLockup.end > 0 || _amount > 0, "Amount must be greater than 0");
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
        _writeGlobalCheckpoint(0, 0);
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
        Checkpoint memory oldCheckpoint;
        Checkpoint memory newCheckpoint;

        int128 oldSlopeDelta = 0;
        int128 newSlopeDelta = 0;

        if (_oldLockup.end > block.timestamp && _oldLockup.amount > 0) {
            // Old checkpoint still active, calculates its slope and bias
            oldCheckpoint.slope =
                _oldLockup.amount /
                SafeCast.toInt128(int256(MAX_LOCK_TIME));
            oldCheckpoint.bias =
                oldCheckpoint.slope *
                SafeCast.toInt128(int256(_oldLockup.end - block.timestamp));
        }
        if (_newLockup.end > block.timestamp && _newLockup.amount > 0) {
            // New lockup also active, calculate its slope and bias
            newCheckpoint.slope =
                _newLockup.amount /
                SafeCast.toInt128(int256(MAX_LOCK_TIME));
            newCheckpoint.bias =
                newCheckpoint.slope *
                SafeCast.toInt128(int256(_newLockup.end - block.timestamp));
        }

        uint256 userCurrentEpoch = userEpoch[_account];
        if (userCurrentEpoch == 0) {
            // First user epoch, push first checkpoint
            _userCheckpoints[_account].push(oldCheckpoint);
        }

        newCheckpoint.ts = block.timestamp;
        newCheckpoint.blk = block.number;
        userEpoch[_account] = userCurrentEpoch + 1;
        // Push second checkpoint
        _userCheckpoints[_account].push(newCheckpoint);

        oldSlopeDelta = slopeChanges[_oldLockup.end];
        if (_newLockup.end != 0) {
            if (_newLockup.end == _oldLockup.end) {
                // Lockup dates are the same end time, slope delta is the same
                newSlopeDelta = oldSlopeDelta;
            } else {
                newSlopeDelta = slopeChanges[_newLockup.end];
            }
        }

        _writeGlobalCheckpoint(
            newCheckpoint.slope - oldCheckpoint.slope,
            newCheckpoint.bias - oldCheckpoint.bias
        );

        /* Schedule the slope changes. There is a possible code simplification where
         * we always undo the old checkpoint slope change and always apply the new
         * checkpoint slope change. In the interest of gas optimization the code is
         * slightly more complicated.
         */

        // old lockup still active and needs slope change adjustment.
        if (_oldLockup.end > block.timestamp) {
            // this is an adjustment of the slope: oldSlopeDelta was <something> - oldCheckpoint.slope,
            // so we cancel/undo that
            oldSlopeDelta = oldSlopeDelta + oldCheckpoint.slope;
            // gas optimize it so another storage access for _newLockup is not required
            if (_newLockup.end == _oldLockup.end) {
                // It was a new deposit, not extension
                oldSlopeDelta = oldSlopeDelta - newCheckpoint.slope;
            }
            slopeChanges[_oldLockup.end] = oldSlopeDelta;
        }
        if (_newLockup.end > block.timestamp) {
            // (second part of gas optimization) it was an extension
            if (_newLockup.end > _oldLockup.end) {
                newSlopeDelta = newSlopeDelta - newCheckpoint.slope;
                slopeChanges[_newLockup.end] = newSlopeDelta;
            }
        }
    }

    /**
     * @dev Write a global checkpoints. Global checkpoints are used to calculate the
     * total supply for current and historical blocks.
     * @param userSlopeDelta Change in slope that triggered this checkpoint
     * @param userBiasDelta Change in bias that triggered this checkpoint
     */
    function _writeGlobalCheckpoint(int128 userSlopeDelta, int128 userBiasDelta)
        private
    {
        Checkpoint memory lastCheckpoint;
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

        Checkpoint memory initialLastCheckpoint = Checkpoint({
            bias: 0,
            slope: 0,
            ts: lastCheckpoint.ts,
            blk: lastCheckpoint.blk
        });

        uint256 blockSlope = 0; // dblock/dt
        if (block.timestamp > lastCheckpoint.ts) {
            // Scaled up
            blockSlope =
                ((block.number - lastCheckpoint.blk) * 1e18) /
                (block.timestamp - lastCheckpoint.ts);
        }

        uint256 lastCheckpointTimestamp = lastCheckpoint.ts;
        uint256 iterativeTime = _floorToWeek(lastCheckpointTimestamp);

        /* Iterate from last global checkpoint in one week interval steps until present
         * time is reached. Fill in the missing global checkpoints using slopeChanges - which
         * always pertain only to the latest global checkpoint.
         */
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
            lastCheckpointTimestamp = iterativeTime;
            lastCheckpoint.blk =
                initialLastCheckpoint.blk +
                ((blockSlope * (iterativeTime - initialLastCheckpoint.ts)) /
                    1e18); // Scale back down

            globalEpoch += 1;

            if (iterativeTime == block.timestamp) {
                lastCheckpoint.blk = block.number;
                // Adjust the last checkpoint for any delta from the user
                lastCheckpoint.slope = max(
                    lastCheckpoint.slope + userSlopeDelta,
                    0
                );
                lastCheckpoint.bias = max(
                    lastCheckpoint.bias + userBiasDelta,
                    0
                );
                _globalCheckpoints.push(lastCheckpoint);
                break;
            } else {
                _globalCheckpoints.push(lastCheckpoint);
            }
        }
    }

    /**
     * @dev Binary search (bisection) to find epoch closest to block.
     * @param _block Find the most recent point history before this block
     * @param _maxEpoch Maximum epoch
     * @return uint256 The most recent epoch before the block
     */
    function _findEpoch(
        Checkpoint[] memory _checkpoints,
        uint256 _block,
        uint256 _maxEpoch
    ) internal pure returns (uint256) {
        uint256 minEpoch = 0;
        uint256 maxEpoch = _maxEpoch;
        for (uint256 i = 0; i < 128; i++) {
            if (minEpoch >= maxEpoch) break;
            uint256 mid = (minEpoch + maxEpoch + 1) / 2;
            if (_checkpoints[mid].blk <= _block) {
                minEpoch = mid;
            } else {
                maxEpoch = mid - 1;
            }
        }
        return minEpoch;
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
     * @dev Gets a users votingWeight at a given blockNumber
     * @param _account User for which to return the balance
     * @param _blockNumber Block at which to calculate balance
     * @return uint256 Balance of user voting power.
     */
    function balanceOfAt(address _account, uint256 _blockNumber)
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
            _globalCheckpoints,
            _blockNumber,
            globalEpoch // Max epoch
        );
        Checkpoint memory checkpoint0 = _globalCheckpoints[recentGlobalEpoch];

        // Calculate delta (block & time) between checkpoint and target block
        // Allowing us to calculate the average seconds per block between
        // the two points
        uint256 dBlock = 0;
        uint256 dTime = 0;
        if (recentGlobalEpoch < globalEpoch) {
            Checkpoint memory checkpoint1 = _globalCheckpoints[
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
        if (userPoint.bias >= 0) {
            return SafeCast.toUint256(userPoint.bias);
        } else {
            return 0;
        }
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
        require(_blockNumber <= block.number, "Block number is in the future");

        // Get most recent global Checkpoint to block
        uint256 recentGlobalEpoch = _findEpoch(
            _globalCheckpoints,
            _blockNumber,
            globalEpoch
        );

        Checkpoint memory checkpoint0 = _globalCheckpoints[recentGlobalEpoch];

        if (checkpoint0.blk > _blockNumber) {
            return 0;
        }

        uint256 dTime = 0;
        if (recentGlobalEpoch < globalEpoch) {
            Checkpoint memory checkpoint1 = _globalCheckpoints[
                recentGlobalEpoch + 1
            ];
            if (checkpoint0.blk != checkpoint1.blk) {
                /* to estimate how much time has passed since the last checkpoint get the number
                 * of blocks since the last checkpoint. And multiply that by the average time per
                 * block of the 2 neighboring checkpoints of said _blockNumber
                 */
                dTime =
                    ((_blockNumber - checkpoint0.blk) *
                        (checkpoint1.ts - checkpoint0.ts)) /
                    (checkpoint1.blk - checkpoint0.blk);
            }
        } else if (checkpoint0.blk != block.number) {
            /* to estimate how much time has passed since the last checkpoint get the number
             * of blocks since the last checkpoint. And multiply that by the average time per
             * block since the last checkpoint and present blockchain state.
             */
            dTime =
                ((_blockNumber - checkpoint0.blk) *
                    (block.timestamp - checkpoint0.ts)) /
                (block.number - checkpoint0.blk);
        }
        // if code doesn't enter any of the above if conditions latest _blockNumber was passed
        // to the function and dTime is correctly set to 0

        // Now dTime contains info on how far are we beyond point
        return _supplyAt(checkpoint0, checkpoint0.ts + dTime);
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
     * @dev Floors a timestamp to the nearest weekly increment
     * @param _t Timestamp to floor
     * @return Timestamp floored to nearest weekly increment
     */
    function _floorToWeek(uint256 _t) internal pure returns (uint256) {
        return (_t / WEEK) * WEEK;
    }

    /**
     * @dev Returns the largest of two numbers.
     * @param _a First number
     * @param _b Second number
     * @return Largest of _a and _b
     */
    function max(uint256 _a, uint256 _b) internal pure returns (uint256) {
        return _a >= _b ? _a : _b;
    }

    /**
     * @dev Returns the smallest of two numbers.
     * @param _a First number
     * @param _b Second number
     * @return Smallest of _a and _b
     */
    function max(int128 _a, int128 _b) internal pure returns (int128) {
        return _a >= _b ? _a : _b;
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyOwner
    {}
}
