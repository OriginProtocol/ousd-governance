// SPDX-License-Identifier: MIT

pragma solidity 0.8.10;

import "forge-std/Script.sol";
import {Addresses} from "contracts/utils/Addresses.sol";
import {IMintableERC20} from "contracts/interfaces/IMintableERC20.sol";
import {ExponentialStaking} from "contracts/ExponentialStaking.sol";
import {FixedRateRewardsSource} from "contracts/FixedRateRewardsSource.sol";

contract APYCalc is Script {
    uint256 constant BASE_SCALE = 10_000 ether;

    function run() external {
        IMintableERC20 ogn = IMintableERC20(Addresses.OGN);
        ExponentialStaking xogn = ExponentialStaking(0x63898b3b6Ef3d39332082178656E9862bee45C57);
        FixedRateRewardsSource ognRewardsSource = FixedRateRewardsSource(0x7609c88E5880e934dd3A75bCFef44E31b1Badb8b);

        (, uint192 rewardsPerSecond) = ognRewardsSource.rewardConfig();
        uint256 rewardsPerYear = rewardsPerSecond * 60 * 60 * 24 * 365;

        uint256 xognTotalSupply = xogn.totalSupply();

        /// Global APY
        uint256 globalApy = (BASE_SCALE * rewardsPerYear / xognTotalSupply) / 1 ether;
        console.log("Global APY (1e4): %i", globalApy);

        /// User APY
        address userAddress = address(11);
        uint256 stakeAmount = 10000 ether;
        uint256 duration = 365 days;

        (uint256 xognPreview,) = xogn.previewPoints(stakeAmount, duration);
        uint256 userRewardShare = (BASE_SCALE * xognPreview) / (xognTotalSupply + xognPreview);
        uint256 userProjectedRewards = (rewardsPerYear * userRewardShare) / 1 ether;
        uint256 userApy = userProjectedRewards / stakeAmount;
        console.log("User APY (1e4): %i", userApy);
    }
}
