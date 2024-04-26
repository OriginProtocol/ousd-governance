// SPDX-License-Identifier: Unlicense
pragma solidity 0.8.10;

import "forge-std/Test.sol";
import "contracts/upgrades/RewardsSourceProxy.sol";
import "contracts/upgrades/OgvStakingProxy.sol";
import "contracts/tests/MockOGVStaking.sol";
import "contracts/OgvStaking.sol";
import "contracts/RewardsSource.sol";
import "contracts/tests/MockOGV.sol";

contract OgvStakingTest is Test {
    MockOGV ogv;
    OgvStaking staking;

    RewardsSource source;

    address alice = address(0x42);
    address bob = address(0x43);
    address team = address(0x44);
    address migrator = address(0x50);

    uint256 constant EPOCH = 1 days;
    uint256 constant MIN_STAKE_DURATION = 7 days;

    function setUp() public {
        vm.startPrank(team);
        ogv = new MockOGV();
        source = new RewardsSource(address(ogv));

        RewardsSourceProxy rewardsProxy = new RewardsSourceProxy();
        rewardsProxy.initialize(address(source), team, "");
        source = RewardsSource(address(rewardsProxy));

        staking = new OgvStaking(address(ogv), EPOCH, MIN_STAKE_DURATION, address(source), migrator);
        MockOGVStaking mockStaking =
            new MockOGVStaking(address(ogv), EPOCH, MIN_STAKE_DURATION, address(source), migrator);

        OgvStakingProxy stakingProxy = new OgvStakingProxy();
        stakingProxy.initialize(address(mockStaking), team, "");

        source.setRewardsTarget(address(stakingProxy));

        mockStaking = MockOGVStaking(address(stakingProxy));
        mockStaking.setRewardShare(2 * 1e11);

        ogv.mint(alice, 10000 ether);
        ogv.mint(bob, 10000 ether);
        ogv.mint(team, 100000000 ether);
        vm.stopPrank();

        vm.startPrank(alice);
        ogv.approve(address(stakingProxy), 1e70);
        mockStaking.mockStake(2000 ether, 365 days);
        mockStaking.mockStake(1000 ether, 20 days);
        vm.stopPrank();

        vm.startPrank(bob);
        ogv.approve(address(stakingProxy), 1e70);
        mockStaking.mockStake(3300 ether, 60 days);
        vm.stopPrank();

        vm.startPrank(team);
        stakingProxy.upgradeTo(address(staking));
        staking = OgvStaking(address(stakingProxy));
        ogv.approve(address(source), 1e70);
        vm.stopPrank();
    }

    function testStake() public {
        vm.expectRevert(bytes4(keccak256("StakingDisabled()")));
        staking.stake(100, 100);
    }

    function testStakeTo() public {
        vm.expectRevert(bytes4(keccak256("StakingDisabled()")));
        staking.stake(100, 100, address(0xdead));
    }

    function testExtend() public {
        vm.expectRevert(bytes4(keccak256("StakingDisabled()")));
        staking.extend(1, 100);
    }

    function testPreviewPoints() public {
        vm.expectRevert(bytes4(keccak256("StakingDisabled()")));
        staking.previewPoints(1, 100);
    }

    function testDisabledInflation() public {
        uint256 expectedRewards = (staking.balanceOf(alice) * 2 ether) / 10 ether;

        assertEq(staking.previewRewards(alice), expectedRewards, "Inflation not disabled");

        vm.warp(EPOCH + 100 days);
        assertEq(staking.previewRewards(alice), expectedRewards, "Inflation not disabled");

        vm.warp(EPOCH + 2000 days);
        assertEq(staking.previewRewards(alice), expectedRewards, "Inflation not disabled");
    }

    function testCollectRewards() public {
        uint256 balanceBefore = ogv.balanceOf(alice);
        uint256 expectedRewards = (staking.balanceOf(alice) * 2 ether) / 10 ether;

        // Should allow claiming rewards once
        vm.prank(alice);
        staking.collectRewards();

        assertEq(ogv.balanceOf(alice), expectedRewards + balanceBefore, "Reward not collected");

        assertEq(staking.previewRewards(alice), 0, "Reward not collected");

        // Should not allow claiming more than once
        vm.prank(alice);
        staking.collectRewards();

        assertEq(ogv.balanceOf(alice), expectedRewards + balanceBefore, "Reward collected more than once");
    }

    function testUnstake() public {
        // Should have no penaly for early unstaking
        vm.startPrank(alice);

        uint256 ogvBalanceBefore = ogv.balanceOf(alice);
        uint256 veOgvBalanceBefore = staking.balanceOf(alice);

        (uint128 amount, uint128 end, uint256 points) = staking.lockups(alice, 1);

        (uint256 unstakedAmount, uint256 rewardCollected) = staking.unstake(1);

        assertEq(unstakedAmount, amount, "Penalty applied with Unstake");

        assertEq((veOgvBalanceBefore * 2 ether) / 10 ether, rewardCollected, "Reward mismatch");

        assertEq(staking.balanceOf(alice), veOgvBalanceBefore - points, "veOGV not burned");

        assertEq(ogv.balanceOf(alice), ogvBalanceBefore + unstakedAmount + rewardCollected, "OGV balance mismatch");

        (amount, end, points) = staking.lockups(alice, 1);

        assertEq(end, 0, "Not unstaked");

        assertEq(points, 0, "Not unstaked, points mismatch");

        assertEq(amount, 0, "Not unstaked, amount mismatch");

        // Should revert if it's already unstaked
        vm.expectRevert(abi.encodeWithSelector(bytes4(keccak256("AlreadyUnstaked(uint256)")), uint256(1)));
        staking.unstake(1);

        vm.stopPrank();
    }

    function testUnstakeMultiple() public {
        vm.startPrank(alice);

        uint256 ogvBalanceBefore = ogv.balanceOf(alice);
        uint256 veOgvBalanceBefore = staking.balanceOf(alice);

        uint256[] memory lockupIds = new uint256[](2);
        lockupIds[1] = 1;
        (uint256 unstakedAmount, uint256 rewardCollected) = staking.unstake(lockupIds);

        assertEq(unstakedAmount, 3000 ether, "Penalty applied with Unstake");

        assertEq((veOgvBalanceBefore * 2 ether) / 10 ether, rewardCollected, "Reward mismatch");

        assertEq(staking.balanceOf(alice), 0, "veOGV not burned");

        assertEq(ogv.balanceOf(alice), ogvBalanceBefore + unstakedAmount + rewardCollected, "OGV balance mismatch");

        for (uint256 i = 0; i < 2; ++i) {
            (uint128 amount, uint128 end, uint256 points) = staking.lockups(alice, i);

            assertEq(end, 0, "Not unstaked");

            assertEq(points, 0, "Not unstaked, points mismatch");

            assertEq(amount, 0, "Not unstaked, amount mismatch");

            // Should revert if it's already unstaked
            vm.expectRevert(abi.encodeWithSelector(bytes4(keccak256("AlreadyUnstaked(uint256)")), i));
            staking.unstake(i);
        }

        vm.stopPrank();
    }

    function testUnstakeForMigration() public {
        vm.startPrank(migrator);

        uint256 ogvBalanceBefore = ogv.balanceOf(alice);
        uint256 veOgvBalanceBefore = staking.balanceOf(alice);

        uint256[] memory lockupIds = new uint256[](2);
        lockupIds[1] = 1;
        (uint256 unstakedAmount, uint256 rewardCollected) = staking.unstakeFrom(alice, lockupIds);

        assertEq(unstakedAmount, 3000 ether, "Penalty applied with Unstake");

        assertEq((veOgvBalanceBefore * 2 ether) / 10 ether, rewardCollected, "Reward mismatch");

        assertEq(staking.balanceOf(alice), 0, "veOGV not burned");

        assertEq(ogv.balanceOf(alice), ogvBalanceBefore + unstakedAmount + rewardCollected, "OGV balance mismatch");

        for (uint256 i = 0; i < 2; ++i) {
            (uint128 amount, uint128 end, uint256 points) = staking.lockups(alice, i);

            assertEq(end, 0, "Not unstaked");

            assertEq(points, 0, "Not unstaked, points mismatch");

            assertEq(amount, 0, "Not unstaked, amount mismatch");
        }

        vm.stopPrank();
    }

    function testUnstakeFromPermission() public {
        vm.prank(team);
        uint256[] memory lockupIds = new uint256[](1);
        vm.expectRevert(bytes4(keccak256("NotMigrator()")));
        staking.unstakeFrom(alice, lockupIds);
    }

    function testUnstakeLockupLength() public {
        vm.prank(alice);
        uint256[] memory lockupIds = new uint256[](0);
        vm.expectRevert(bytes4(keccak256("NoLockupsToUnstake()")));
        staking.unstake(lockupIds);
    }
}
