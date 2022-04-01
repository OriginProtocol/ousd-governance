// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "OpenZeppelin/openzeppelin-contracts@4.5.0/contracts/utils/math/SafeCast.sol";
import "OpenZeppelin/openzeppelin-contracts@4.5.0/contracts/utils/Strings.sol";

contract VoteLocker {
    ///@notice Definition of a week
    uint256 internal constant WEEK = 7 days;
    ///@notice Maximum lock time
    uint256 public constant MAX_LOCK_TIME = 4 * 365 * 86400; // 4 years

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

        _writeGlobalCheckpoint(
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
     * @dev Write a global checkpoints. Global checkpoints are used to calculate the
     * total supply for current and historical blocks.
     * @param userSlopeDelta Change in slope that triggered this checkpoint
     * @param userBiasDelta Change in bias that triggered this checkpoint
     * @param groupState TODO
     */
    function _writeGlobalCheckpoint(
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
}
