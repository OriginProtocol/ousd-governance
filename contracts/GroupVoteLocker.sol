// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "./BaseVoteLocker.sol";
import "OpenZeppelin/openzeppelin-contracts@4.5.0/contracts/utils/math/SafeCast.sol";
import "OpenZeppelin/openzeppelin-contracts@4.5.0/contracts/utils/Strings.sol";
import "./console.sol";

contract GroupVoteLocker is BaseVoteLocker {
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

    struct GroupVotePowerState {
        Checkpoint[] checkpoints;
        mapping(uint256 => int128) slopeChanges;
        uint256 epoch;
    }



    /* @dev
     * 
     */
    function _updateGroupState(
        Lockup memory oldLockup,
        Lockup memory newLockup,
        Checkpoint memory oldCheckpoint,
        Checkpoint memory newCheckpoint,
        GroupVotePowerState storage groupState
    )
        internal 
    {
        int128 oldSlopeDelta = 0;
        int128 newSlopeDelta = 0;

        oldSlopeDelta = groupState.slopeChanges[oldLockup.end];
        if (newLockup.end != 0) {
            if (newLockup.end == oldLockup.end) {
                // Lockup dates are the same end time, slope delta is the same
                newSlopeDelta = oldSlopeDelta;
            } else {
                newSlopeDelta = groupState.slopeChanges[newLockup.end];
            }
        }

        _writeGroupCheckpoint(
            newCheckpoint.slope - oldCheckpoint.slope,
            newCheckpoint.bias - oldCheckpoint.bias,
            groupState
        );

        /* Schedule the slope changes. There is a possible code simplification where
         * we always undo the old checkpoint slope change and always apply the new
         * checkpoint slope change. In the interest of gas optimization the code is 
         * slightly more complicated.
         */

        // old lockup still active and needs slope change adjustment. 
        if (oldLockup.end > block.timestamp) {
            // this is an adjustment of the slope: oldSlopeDelta was <something> - oldCheckpoint.slope, 
            // so we cancel/undo that
            oldSlopeDelta = oldSlopeDelta + oldCheckpoint.slope;
            // gas optimize it so another storage access for newLockup is not required
            if (newLockup.end == oldLockup.end) {
                // It was a new deposit, not extension
                oldSlopeDelta = oldSlopeDelta - newCheckpoint.slope;
            }
            groupState.slopeChanges[oldLockup.end] = oldSlopeDelta;
        }
        if (newLockup.end > block.timestamp) {
            // (second part of gas optimization) it was an extension
            if (newLockup.end > oldLockup.end) {
                newSlopeDelta = newSlopeDelta - newCheckpoint.slope;
                groupState.slopeChanges[newLockup.end] = newSlopeDelta;
            }
        }
    }

    /**
     * @dev TODO
     * @param userSlopeDelta Change in slope that triggered this checkpoint
     * @param userBiasDelta Change in bias that triggered this checkpoint
     * @param groupState TODO
     */
    function _writeGroupCheckpoint(
        int128 userSlopeDelta,
        int128 userBiasDelta,
        GroupVotePowerState storage groupState
    )
        internal
    {
        Checkpoint memory lastCheckpoint;
        if (groupState.epoch > 0) {
            lastCheckpoint = groupState.checkpoints[groupState.epoch];
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
                slopeDelta = groupState.slopeChanges[iterativeTime];
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

            groupState.epoch += 1;

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
                groupState.checkpoints.push(lastCheckpoint);
                break;
            } else {
                groupState.checkpoints.push(lastCheckpoint);
            }
        }
    }

    function totalVotePower(GroupVotePowerState storage votePower) internal view returns (uint256) {
        if (votePower.checkpoints.length == 0) {
            return 0;
        }
        Checkpoint memory lastCheckpoint = votePower.checkpoints[votePower.epoch];
        return _votePowerAt(votePower, lastCheckpoint, block.timestamp);
    }

    function totalVotePowerAt(GroupVotePowerState storage votePower, uint256 _blockNumber) internal view returns (uint256) {
        require(_blockNumber <= block.number, "Block number is in the future");

        // Get most recent global Checkpoint to block
        uint256 recentGlobalEpoch = _findEpoch(
            votePower.checkpoints,
            _blockNumber,
            votePower.epoch
        );

        Checkpoint memory checkpoint0 = votePower.checkpoints[recentGlobalEpoch];

        if (checkpoint0.blk > _blockNumber) {
            return 0;
        }

        uint256 dTime = 0;
        if (recentGlobalEpoch < votePower.epoch) {
            Checkpoint memory checkpoint1 = votePower.checkpoints[
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
        return _votePowerAt(votePower, checkpoint0, checkpoint0.ts + dTime);
    }

    function _votePowerAt(GroupVotePowerState storage votePower, Checkpoint memory _checkpoint, uint256 _time)
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
                dSlope = votePower.slopeChanges[iterativeTime];
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

    // function getEmptyCheckpoint() internal pure returns (Checkpoint memory) {
    //     return Checkpoint({
    //        bias: 0,
    //        slope: 0,
    //        ts: 0,
    //        blk: 0
    //     });
    // }

    // function getEmptyLockup() internal pure returns (Lockup memory) {
    //     return Lockup({
    //        amount: 0,
    //        end: 0
    //     });
    // }

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
    ) internal view returns (uint256) {
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
}
