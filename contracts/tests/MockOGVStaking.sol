// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import "../OgvStaking.sol";

struct Lockup {
    uint128 amount;
    uint128 end;
    uint256 points;
}

contract MockOGVStaking is OgvStaking {
    constructor(address ogv_, uint256 epoch_, uint256 minStakeDuration_, address rewardsSource_, address migrator_)
        OgvStaking(ogv_, epoch_, minStakeDuration_, rewardsSource_, migrator_)
    {}

    function _previewPoints(uint256 amount, uint256 duration) internal view returns (uint256, uint256) {
        require(duration >= minStakeDuration, "Staking: Too short");
        require(duration <= 1461 days, "Staking: Too long");
        uint256 start = block.timestamp > epoch ? block.timestamp : epoch;
        uint256 end = start + duration;
        uint256 endYearpoc = ((end - epoch) * 1e18) / 365 days;
        uint256 multiplier = PRBMathUD60x18.pow(YEAR_BASE, endYearpoc);
        return ((amount * multiplier) / 1e18, end);
    }

    function mockStake(uint256 amountIn, uint256 duration) external {
        mockStake(amountIn, duration, msg.sender);
    }

    function mockStake(uint256 amountIn, uint256 duration, address to) public {
        Lockup memory lockup;

        ogv.transferFrom(msg.sender, address(this), amountIn);

        (uint256 points, uint256 end) = _previewPoints(amountIn, duration);
        require(points + totalSupply() <= type(uint192).max, "Staking: Max points exceeded");

        lockup.end = uint128(end);
        lockup.amount = uint128(amountIn);
        lockup.points = points;

        uint256 lockupId = lockups[to].length;

        lockups[to].push(lockup);

        _mint(to, points);
        emit Stake(to, uint256(lockupId), amountIn, end, points);

        if (!hasDelegationSet[to]) {
            hasDelegationSet[to] = true;
            super._delegate(to, to);
        }
    }

    function setRewardShare(uint256 _accRewardPerShare) external {
        accRewardPerShare = _accRewardPerShare;
    }
}
