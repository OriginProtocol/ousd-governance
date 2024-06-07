// SPDX-License-Identifier: Unlicense
pragma solidity 0.8.10;

import "forge-std/Test.sol";

import {Addresses} from "contracts/utils/Addresses.sol";
import {DeployManager} from "script/deploy/DeployManager.sol";

import {ExponentialStaking} from "contracts/ExponentialStaking.sol";
import {Timelock} from "contracts/Timelock.sol";
import {Governance} from "contracts/Governance.sol";

import {IMintableERC20} from "contracts/interfaces/IMintableERC20.sol";
import {FixedRateRewardsSource} from "contracts/FixedRateRewardsSource.sol";

contract OGNRewardsSourceForkTest is Test {
    DeployManager public deployManager;
    ExponentialStaking public xogn;
    Timelock public timelock;
    Governance public xognGov;

    IMintableERC20 public ogn;
    FixedRateRewardsSource public ognRewardsSource;

    address public alice = address(101);
    address public bob = address(102);

    uint256 constant OGN_EPOCH = 1717041600; // May 30, 2024 GMT

    uint256 constant REWARDS_PER_SECOND = 0.57 ether;

    int256 constant NEW_STAKE = -1;

    constructor() {
        deployManager = new DeployManager();

        deployManager.setForkFileId(string(abi.encodePacked(vm.toString(block.chainid), "-OGNRewardsSourceForkTest")));

        deployManager.setUp();
        deployManager.run();
    }

    function setUp() external {
        xogn = ExponentialStaking(deployManager.getDeployment("XOGN"));
        timelock = Timelock(payable(Addresses.TIMELOCK));
        xognGov = Governance(payable(deployManager.getDeployment("XOGN_GOV")));

        ogn = IMintableERC20(Addresses.OGN);

        ognRewardsSource = FixedRateRewardsSource(deployManager.getDeployment("OGN_REWARDS_SOURCE"));

        vm.startPrank(Addresses.TIMELOCK);
        ogn.mint(alice, 200000 ether);
        ogn.mint(bob, 200000 ether);
        vm.stopPrank();

        vm.startPrank(alice);
        ogn.approve(address(xogn), 1e70);
        vm.stopPrank();

        vm.startPrank(bob);
        ogn.approve(address(xogn), 1e70);
        vm.stopPrank();

        vm.warp(OGN_EPOCH);
    }

    function testRewardRate() external view {
        (, uint192 rewardsPerSecond) = ognRewardsSource.rewardConfig();
        assertEq(rewardsPerSecond, REWARDS_PER_SECOND, "Invalid reward rate");
    }

    function testRewardDistribution() external {
        (uint64 lastCollect,) = ognRewardsSource.rewardConfig();
        vm.warp(lastCollect);

        uint256 rewardsBefore = ognRewardsSource.previewRewards();
        vm.warp(lastCollect + 1 days);

        uint256 rewardsFor24h = uint256(REWARDS_PER_SECOND * 60 * 60 * 24);
        uint256 balance = ogn.balanceOf(address(ognRewardsSource));
        if (rewardsFor24h > balance) {
            rewardsFor24h = balance;
        }

        assertEq(rewardsBefore + ognRewardsSource.previewRewards(), rewardsFor24h, "Invalid reward after 1d");
    }
}
