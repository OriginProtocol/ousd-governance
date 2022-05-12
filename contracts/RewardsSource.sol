pragma solidity 0.8.10;
import {ERC20Votes} from "OpenZeppelin/openzeppelin-contracts@4.6.0/contracts/token/ERC20/extensions/ERC20Votes.sol";
import {ERC20Permit} from "OpenZeppelin/openzeppelin-contracts@4.6.0/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
import {ERC20} from "OpenZeppelin/openzeppelin-contracts@4.6.0/contracts/token/ERC20/ERC20.sol";
import {PRBMathUD60x18} from "paulrberg/prb-math@2.5.0/contracts/PRBMathUD60x18.sol";
import { Governable } from "./Governable.sol";

interface Mintable {
    function mintTo(address to, uint256 amount) external;
}

contract RewardsSource is Governable {
    ERC20 public immutable ogv;
    uint256 public immutable epoch;
    address public rewardsTarget;

    uint256 public lastRewardTime;
    uint256[] public rewardMonths;
    uint256 private currentKneeIndex = 0;

    struct Knee {
        uint64 start; // uint64 = billions and billions of years
        uint64 end; // Internal use only. By duplicating the start of the next knee, we can save a slot read
        uint128 ratePerDay;
    }
    Knee[] public inflationKnees;

    uint256 constant MAX_KNEES = 48;
    uint256 constant MAX_INFLATION_PER_DAY = (5 * 1e6 * 1e18);

    constructor(address ogv_, uint256 epoch_){
        require(ogv_!=address(0), "OGV must be set");
        ogv = ERC20(ogv_);
        epoch = epoch_;
    }

    function collectRewards() external returns (uint256) {
        require(msg.sender == rewardsTarget, "Not rewardsTarget");
        if(block.timestamp <= lastRewardTime){ return 0; }
        (uint256 rewards, uint256 _nextKneeIndex) = _calcRewards();
        if(_nextKneeIndex != 0){ currentKneeIndex = _nextKneeIndex; }
        lastRewardTime = block.timestamp;
        Mintable(address(ogv)).mintTo(rewardsTarget, rewards);
        return rewards;
    }

    function previewRewards() external view returns (uint256) {
        (uint256 rewards,) = _calcRewards();
        return rewards;
    }

    function _calcRewards() internal view returns (uint256, uint256) {
        uint256 last = lastRewardTime;
        if(last == 0) { return (0, currentKneeIndex); }
        if(last >= block.timestamp){ return (0, currentKneeIndex); }
        if(inflationKnees.length == 0 ){ return (0, currentKneeIndex); }
        uint256 total = 0;
        uint256 nextKneeIndex = 0;
        uint256 _currentKneeIndex = currentKneeIndex;
        uint256 i;
        for(i = _currentKneeIndex; i < inflationKnees.length; i++){
            Knee memory knee = inflationKnees[i];
            uint256 slopeStart = knee.start;
            uint256 slopeEnd = knee.end;
            uint256 rangeStart = last;
            uint256 rangeEnd = block.timestamp;
            if(rangeStart > slopeEnd){ continue; } // no slope overlap possible
            if(rangeEnd < slopeStart){ continue; } // no slope overlap possible
            if(rangeStart < slopeStart){ rangeStart = slopeStart; }
            if(rangeEnd > slopeEnd){ rangeEnd = slopeEnd; }
            uint256 duration = rangeEnd - rangeStart;
            total += duration * knee.ratePerDay / 1 days;
            if(i > _currentKneeIndex && duration > 0){ 
                nextKneeIndex = i; // We have moved into a new slope
            }
            if(slopeEnd < rangeEnd){ break; } // No future slope could match
        }
        return (total, nextKneeIndex);
    }

    function setInflation(Knee[] memory knees) external onlyGovernor { // slope ends intentionaly are overwritten
        require(knees.length <= MAX_KNEES, "Too many knees");
        delete inflationKnees;
        currentKneeIndex = 0;
        uint256 minKneeStart = 0;
        if(knees.length == 0){ return; }
        knees[knees.length - 1].end = type(uint64).max;
        for(uint256 i = 0; i < knees.length; i++){
            require(knees[i].ratePerDay <= MAX_INFLATION_PER_DAY, "ratePerDay too high");
            if(i < knees.length - 1){
                require(knees[i].start > minKneeStart, "start times must increase");
                knees[i].end = knees[i+1].start;
            }
            inflationKnees.push(knees[i]);
        }
    }

    function setRewardsTarget(address rewardsTarget_) external onlyGovernor {
        rewardsTarget = rewardsTarget_; // Okay to be zero, just disables collecting rewards
    }
}
