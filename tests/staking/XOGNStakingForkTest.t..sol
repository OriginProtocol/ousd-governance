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

contract XOGNStakingForkTest is Test {
    DeployManager public deployManager;
    ExponentialStaking public xogn;
    Timelock public timelock;
    Governance public xognGov;

    IMintableERC20 public ogn;
    address public ognRewardsSource;

    address public alice = address(101);
    address public bob = address(102);
    address public xognWhale = address(103);

    uint256 constant OGN_EPOCH = 1717041600; // May 30, 2024 GMT

    uint256 constant REWARDS_PER_SECOND = 300000 ether / uint256(24 * 60 * 60); // 300k per day

    int256 constant NEW_STAKE = -1;

    constructor() {
        deployManager = new DeployManager();

        deployManager.setUp();
        deployManager.run();
    }

    function setUp() external {
        xogn = ExponentialStaking(deployManager.getDeployment("XOGN"));
        timelock = Timelock(payable(Addresses.TIMELOCK));
        xognGov = Governance(payable(deployManager.getDeployment("XOGN_GOV")));

        ogn = IMintableERC20(Addresses.OGN);

        ognRewardsSource = deployManager.getDeployment("OGN_REWARDS_SOURCE");

        vm.startPrank(Addresses.TIMELOCK);
        ogn.mint(alice, 200000 ether);
        ogn.mint(bob, 200000 ether);
        ogn.mint(xognWhale, 1000_000_000 ether);
        vm.stopPrank();

        vm.startPrank(alice);
        ogn.approve(address(xogn), 1e70);
        vm.stopPrank();

        vm.startPrank(bob);
        ogn.approve(address(xogn), 1e70);
        vm.stopPrank();

        vm.warp(OGN_EPOCH + 100 days);
    }

    function testTokenName() external view {
        assertEq(xogn.symbol(), "xOGN", "Incorrect symbol");
    }

    function testStake() external {
        vm.startPrank(alice);
        (uint256 previewPoints, uint256 previewEnd) = xogn.previewPoints(1000 ether, 30 days);

        xogn.stake(
            1000 ether, // 1000 OGN
            30 days,
            alice,
            false,
            NEW_STAKE
        );

        assertEq(xogn.lockupsCount(alice), 1, "Invalid lockup count");
        assertEq(ogn.balanceOf(alice), 199000 ether, "Incorrect OGN balance");

        (uint128 lockupAmount, uint128 lockupEnd, uint256 lockupPoints) = xogn.lockups(alice, 0);
        assertEq(lockupAmount, 1000 ether);
        assertEq(lockupEnd, OGN_EPOCH + 30 days);
        assertEq(lockupEnd, previewEnd);
        assertEq(lockupPoints, previewPoints);

        assertEq(xogn.accRewardPerShare(), xogn.rewardDebtPerShare(alice));

        vm.stopPrank();
    }

    function testUnstake() external {
        vm.startPrank(alice);

        console.log(FixedRateRewardsSource(ognRewardsSource).previewRewards());

        xogn.stake(
            1000 ether, // 1k OGN
            30 days,
            alice,
            false,
            NEW_STAKE
        );

        assertEq(xogn.lockupsCount(alice), 1, "Invalid lockup count");

        vm.warp(OGN_EPOCH + 31 days);
        uint256 netRewards = xogn.previewRewards(alice);
        xogn.unstake(0);

        assertEq(ogn.balanceOf(alice), netRewards + 200000 ether, "Incorrect OGN balance");

        (uint128 lockupAmount, uint128 lockupEnd, uint256 lockupPoints) = xogn.lockups(alice, 0);
        assertEq(lockupAmount, 0 ether);
        assertEq(lockupEnd, 0);
        assertEq(lockupPoints, 0);

        assertEq(xogn.accRewardPerShare(), xogn.rewardDebtPerShare(alice));

        vm.stopPrank();
    }
}
