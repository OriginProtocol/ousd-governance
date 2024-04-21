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

    function mockStake(uint256 amountIn, uint256 duration) external {
        Lockup memory lockup;

        ogv.transferFrom(msg.sender, address(this), amountIn);

        (uint256 points, uint256 end) = previewPoints(amountIn, duration);
        require(points + totalSupply() <= type(uint192).max, "Staking: Max points exceeded");

        lockup.end = uint128(end);
        lockup.amount = uint128(amountIn);
        lockup.points = points;

        uint256 lockupId = lockups[msg.sender].length;

        lockups[msg.sender].push(lockup);

        _mint(msg.sender, points);
        emit Stake(msg.sender, uint256(lockupId), amountIn, end, points);
    }

    function setRewardShare(uint256 _accRewardPerShare) external {
        accRewardPerShare = _accRewardPerShare;
    }
}
