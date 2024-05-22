// SPDX-License-Identifier: MIT

pragma solidity 0.8.10;

import "forge-std/Test.sol";
import "contracts/upgrades/FixedRateRewardsSourceProxy.sol";
import "contracts/FixedRateRewardsSource.sol";
import "contracts/tests/MockOGN.sol";

contract FixedRateRewardsSourceTest is Test {
    MockOGN ogn;
    FixedRateRewardsSource rewards;

    address staking = address(0x42);
    address governor = address(0x43);
    address alice = address(0x44);
    address strategist = address(0x45);

    function setUp() public {
        vm.startPrank(governor);
        ogn = new MockOGN();
        rewards = new FixedRateRewardsSource(address(ogn));

        // Setup Rewards Proxy
        FixedRateRewardsSourceProxy rewardsProxy = new FixedRateRewardsSourceProxy();
        rewardsProxy.initialize(address(rewards), governor, "");
        rewards = FixedRateRewardsSource(address(rewardsProxy));

        // Initialize
        rewards.initialize(strategist, staking);
        // Configure Rewards
        rewards.setRewardsPerSecond(uint192(100 ether)); // 100 OGN per second

        // Make sure contract has enough OGN for rewards
        ogn.mint(address(rewardsProxy), 1000000 ether);
        vm.stopPrank();
    }

    function testPreviewRewards() public {
        // Should show correct rewards for a block
        vm.warp(block.number + 100);

        assertEq(rewards.previewRewards(), 10000 ether, "Pending reward mismatch");

        vm.warp(block.number + 149);

        assertEq(rewards.previewRewards(), 14900 ether, "Pending reward mismatch");
    }

    function testCollectRewards() public {
        // Accumulate some rewards
        vm.warp(block.number + 100);

        // Should allow collecting rewards
        vm.prank(staking);
        rewards.collectRewards();

        assertEq(rewards.previewRewards(), 0 ether, "Pending reward mismatch");

        assertEq(ogn.balanceOf(address(staking)), 10000 ether, "Rewards not distributed to staking");
    }

    function testCollectPermission() public {
        // Time travel
        vm.warp(block.number + 100);

        // Should allow rewardsTarget to collect rewards
        vm.prank(staking);
        rewards.collectRewards();

        // Should not allow anyone else to collect rewards
        vm.prank(governor);
        vm.expectRevert(bytes4(keccak256("UnauthorizedCaller()")));
        rewards.collectRewards();

        vm.prank(alice);
        vm.expectRevert(bytes4(keccak256("UnauthorizedCaller()")));
        rewards.collectRewards();
    }

    function testNoRevertCollect() public {
        // Disable rewards
        vm.prank(strategist);
        rewards.setRewardsPerSecond(0 ether);

        // Time travel
        vm.warp(block.number + 100);

        // Should allow collecting rewards
        vm.prank(staking);
        rewards.collectRewards();

        // Shouldn't have any change
        assertEq(ogn.balanceOf(address(staking)), 0 ether, "Invalid reward distributed");
    }

    function testDisableRewards() public {
        // Should also allow disabling rewards
        vm.prank(strategist);
        rewards.setRewardsPerSecond(0);

        assertEq(rewards.previewRewards(), 0 ether, "Pending reward mismatch");

        vm.warp(block.number + 1234);

        assertEq(rewards.previewRewards(), 0 ether, "Pending reward mismatch");
    }

    function testLowBalanceCollection() public {
        // Should also allow disabling rewards
        vm.prank(strategist);
        rewards.setRewardsPerSecond(2000000 ether);

        // Should never show more than balance
        vm.warp(block.number + 10);
        assertEq(rewards.previewRewards(), 1000000 ether, "Pending reward mismatch");
        vm.warp(block.number + 123);
        assertEq(rewards.previewRewards(), 1000000 ether, "Pending reward mismatch");
    }

    function testRewardRatePermission() public {
        // Should allow Strategist to change
        vm.prank(strategist);
        rewards.setRewardsPerSecond(1 ether);

        // Should allow Governor to change
        vm.prank(governor);
        rewards.setRewardsPerSecond(2 ether);

        // Should not allow anyone else to change
        vm.prank(alice);
        vm.expectRevert(bytes4(keccak256("UnauthorizedCaller()")));
        rewards.setRewardsPerSecond(2 ether);

        vm.prank(staking);
        vm.expectRevert(bytes4(keccak256("UnauthorizedCaller()")));
        rewards.setRewardsPerSecond(2 ether);
    }

    function testDisableRewardsTarget() public {
        // Should allow Governor to disable rewards
        vm.prank(governor);
        rewards.setRewardsTarget(address(0x0));

        assertEq(rewards.rewardsTarget(), address(0x0), "Storage not updated");
    }

    function testSetRewardsTargetPermission() public {
        // Should allow Governor to change
        vm.prank(governor);
        rewards.setRewardsTarget(address(0xdead));

        assertEq(rewards.rewardsTarget(), address(0xdead), "Storage not updated");

        // Should not allow anyone else to change
        vm.prank(alice);
        vm.expectRevert("Caller is not the Governor");
        rewards.setRewardsTarget(address(0xdead));

        vm.prank(strategist);
        vm.expectRevert("Caller is not the Governor");
        rewards.setRewardsTarget(address(0xdead));
    }

    function testDisableStrategistAddr() public {
        // Should allow Governor to disable rewards
        vm.prank(governor);
        rewards.setStrategistAddr(address(0x0));

        assertEq(rewards.strategistAddr(), address(0x0), "Storage not updated");
    }

    function testSetStrategistAddrPermission() public {
        // Should allow Governor to change
        vm.prank(governor);
        rewards.setStrategistAddr(address(0xdead));

        assertEq(rewards.strategistAddr(), address(0xdead), "Storage not updated");

        // Should not allow anyone else to change
        vm.prank(alice);
        vm.expectRevert("Caller is not the Governor");
        rewards.setStrategistAddr(address(0xdead));

        vm.prank(strategist);
        vm.expectRevert("Caller is not the Governor");
        rewards.setStrategistAddr(address(0xdead));
    }
}
