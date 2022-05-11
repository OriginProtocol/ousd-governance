pragma solidity 0.8.10;
import { ERC20Votes } from "openzeppelin-contracts/contracts/token/ERC20/extensions/ERC20Votes.sol";
import { ERC20Permit } from "openzeppelin-contracts/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
import { ERC20 } from "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import { PRBMathUD60x18 } from "prb-math/PRBMathUD60x18.sol";


contract RewardsSource {
    // 1. Core Storage

    ERC20 public immutable ogv;
    uint256 public immutable epoch;
    address public rewardsTarget;

    // 2. Staking and Lockup Storage

    uint256 constant MAX_REWARDS_UPDATE = 24 * 30 days;
    uint256 public lastRewardTime;
    uint256[] public rewardMonths;

    constructor(address ogv_, uint256 epoch_, address rewardsTarget_){
        require(ogv_!=address(0));
        require(rewardsTarget_!=address(0));
        ogv = ERC20(ogv_);
        epoch = epoch_;
        rewardsTarget = rewardsTarget_;
    }

    function collectRewards() external returns (uint256) {
        require(msg.sender == rewardsTarget, "Not rewardsTarget");
        if(block.timestamp <= lastRewardTime){
            return 0;
        }
        uint256 amount = _calcRewards();
        lastRewardTime = block.timestamp;
        ogv.transfer(rewardsTarget, amount);
        return amount;
    }

    function previewRewards() external view returns (uint256) {
        return _calcRewards();
    }

    function _calcRewards() internal view returns (uint256) {
        if(block.timestamp <= lastRewardTime){
            return 0;
        }
        return rewardsBetween(lastRewardTime, block.timestamp);
    }

    function rewardsBetween(uint256 start, uint256 end)
        public
        view
        returns (uint256)
    {
        uint256 _epoch = epoch;
        if (rewardMonths.length == 0) {
            return 0;
        }
        if (end <= _epoch) {
            return 0;
        }
        if (end <= start) {
            return 0;
        }
        if (start < _epoch) {
            start = _epoch;
        }
        uint256 startMonth = (start - _epoch) / 30 days;
        uint256 endMonth = (end - _epoch) / 30 days;
        if (endMonth >= rewardMonths.length) {
            endMonth = rewardMonths.length - 1;
        }
        uint256 totalRewards = 0;
        for (uint256 i = startMonth; i <= endMonth; i++) {
            uint256 monthRewards = rewardMonths[i];
            uint256 monthStart = _epoch + (i * 30 days);
            uint256 monthEnd = monthStart + 30 days;
            uint256 durationStart = start < monthStart ? monthStart : start;
            uint256 durationEnd = end > monthEnd ? monthEnd : end;
            totalRewards +=
                (monthRewards * (durationEnd - durationStart)) /
                30 days;
        }
        return totalRewards;
    }

    function addRewards(uint256 start, uint256[] calldata amounts) external {
        uint256 beforeLen = rewardMonths.length;
        require(
            (block.timestamp < epoch) ||
                (start > ((block.timestamp - epoch) / 30 days)),
            "Staking: Can only add to future"
        );
        require(start <= beforeLen, "Staking: Start too far");
        uint256 total = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            uint256 amount = amounts[i];
            total += amount;
            if (start + i >= beforeLen) {
                rewardMonths.push(amount);
            } else {
                rewardMonths[start + i] += amount;
            }
        }
        require(rewardMonths.length <= 96, "Too many months");
        ogv.transferFrom(msg.sender, address(this), total);
    }
}
