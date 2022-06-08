// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;
import {Governable} from "./Governable.sol";

interface Mintable {
    function mint(address to, uint256 amount) external;
}

contract RewardsSource is Governable {
    address public immutable ogv;
    address public rewardsTarget; // Contract that receives rewards
    uint256 public lastRewardTime; // Start of the time to calculate rewards over
    uint256 private currentSlopeIndex = 0; // Allows us to start with the correct slope

    struct Slope {
        uint64 start; // uint64 = billions and billions of years
        uint64 end; // Internal use only. By duplicating the start of the next slope, we can save a slot read
        uint128 ratePerDay;
    }
    Slope[] public inflationSlopes;

    uint256 constant MAX_KNEES = 48;
    uint256 constant MAX_INFLATION_PER_DAY = (5 * 1e6 * 1e18);

    event InflationChanged();
    event RewardsTargetChange(address target, address previousTarget);

    constructor(address ogv_) {
        require(ogv_ != address(0), "Rewards: OGV must be set");
        ogv = ogv_;
        lastRewardTime = block.timestamp; // No possible rewards from before contract deployed
    }

    function collectRewards() external returns (uint256) {
        require(msg.sender == rewardsTarget, "Rewards: Not rewardsTarget");
        if (block.timestamp <= lastRewardTime) {
            return 0;
        }
        (uint256 rewards, uint256 _nextSlopeIndex) = _calcRewards();
        if (_nextSlopeIndex != 0) {
            currentSlopeIndex = _nextSlopeIndex;
        }
        lastRewardTime = block.timestamp;
        Mintable(ogv).mint(rewardsTarget, rewards);
        return rewards;
    }

    function previewRewards() external view returns (uint256) {
        (uint256 rewards, ) = _calcRewards();
        return rewards;
    }

    function _calcRewards() internal view returns (uint256, uint256) {
        uint256 last = lastRewardTime;
        if (last >= block.timestamp) {
            return (0, 0); // A zero slopeIndex here results in no change to stored state
        }
        if (inflationSlopes.length == 0) {
            return (0, 0); // Save a slot read by returning a zero constant
        } 
        uint256 total = 0;
        uint256 nextSlopeIndex = 0; // Zero means no change
        uint256 _currentSlopeIndex = currentSlopeIndex;
        uint256 i;
        for (i = _currentSlopeIndex; i < inflationSlopes.length; i++) {
            Slope memory slope = inflationSlopes[i];
            uint256 slopeStart = slope.start;
            uint256 slopeEnd = slope.end;
            uint256 rangeStart = last;
            uint256 rangeEnd = block.timestamp;
            if (rangeEnd < slopeStart) {
                break; // No future slope could match
            } 
            if (rangeStart < slopeStart) {
                rangeStart = slopeStart; // trim to slope edge
            } 
            if (rangeEnd > slopeEnd) {
                rangeEnd = slopeEnd; // trim to slope edge
            } 
            uint256 duration = rangeEnd - rangeStart;
            total += (duration * slope.ratePerDay) / 1 days;
            if (i > _currentSlopeIndex && duration > 0) {
                nextSlopeIndex = i; // We have moved into a new slope
            }
            if (slopeEnd < rangeEnd) {
                break; // No future slope could match
            } 
        }
        return (total, nextSlopeIndex);
    }

    function setInflation(Slope[] memory slopes) external onlyGovernor {
        // slope ends intentionally are overwritten
        uint256 length = slopes.length;
        require(length <= MAX_KNEES, "Rewards: Too many slopes");
        delete inflationSlopes; // Delete all before rebuilding
        currentSlopeIndex = 0; // Reset
        uint256 minSlopeStart = 0;
        if (length == 0) {
            return;
        }
        slopes[length - 1].end = type(uint64).max;
        for (uint256 i = 0; i < length; i++) {
            require(
                slopes[i].ratePerDay <= MAX_INFLATION_PER_DAY,
                "Rewards: RatePerDay too high"
            );
            require(
                slopes[i].start > minSlopeStart,
                "Rewards: Start times must increase"
            );
            if (i < length - 1) {
                slopes[i].end = slopes[i + 1].start;
                minSlopeStart = slopes[i].start;
            }
            inflationSlopes.push(slopes[i]);
        }
        emit InflationChanged();
    }

    function setRewardsTarget(address rewardsTarget_) external onlyGovernor {
        address previousTarget = rewardsTarget;
        rewardsTarget = rewardsTarget_; // Okay to be zero, just disables collecting rewards
        emit RewardsTargetChange(rewardsTarget_, previousTarget);
    }
}
