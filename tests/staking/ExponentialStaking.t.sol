// SPDX-License-Identifier: Unlicense
pragma solidity 0.8.10;

import "forge-std/Test.sol";
import "contracts/upgrades/RewardsSourceProxy.sol";
import "contracts/upgrades/OgvStakingProxy.sol";
import "contracts/ExponentialStaking.sol";
import "contracts/RewardsSource.sol";
import "contracts/tests/MockOGV.sol";

contract ExponentialStakingTest is Test {
    MockOGV ogn;
    ExponentialStaking staking;
    RewardsSource source;

    address alice = address(0x42);
    address bob = address(0x43);
    address team = address(0x44);

    uint256 constant EPOCH = 1 days;
    uint256 constant MIN_STAKE_DURATION = 7 days;
    int256 constant NEW_STAKE = -1;

    function setUp() public {
        vm.startPrank(team);
        ogn = new MockOGV();
        source = new RewardsSource(address(ogn));

        RewardsSourceProxy rewardsProxy = new RewardsSourceProxy();
        rewardsProxy.initialize(address(source), team, "");
        source = RewardsSource(address(rewardsProxy));

        staking = new ExponentialStaking(address(ogn), EPOCH, MIN_STAKE_DURATION, address(source));
        OgvStakingProxy stakingProxy = new OgvStakingProxy();
        stakingProxy.initialize(address(staking), team, "");
        staking = ExponentialStaking(address(stakingProxy));

        source.setRewardsTarget(address(staking));
        RewardsSource.Slope[] memory slopes = new RewardsSource.Slope[](1);
        slopes[0].start = 1;
        slopes[0].ratePerDay = 0;
        source.setInflation(slopes); // Add from start
        assertGt(source.lastRewardTime(), 0);
        vm.stopPrank();

        ogn.mint(alice, 1000 ether);
        ogn.mint(bob, 1000 ether);
        ogn.mint(team, 100000000 ether);

        vm.prank(alice);
        ogn.approve(address(staking), 1e70);
        vm.prank(bob);
        ogn.approve(address(staking), 1e70);
        vm.prank(team);
        ogn.approve(address(source), 1e70);
    }

    function testStakeUnstake() public {
        vm.startPrank(alice);
        (uint256 previewPoints, uint256 previewEnd) = staking.previewPoints(10 ether, 10 days);

        uint256 beforeOgv = ogn.balanceOf(alice);
        uint256 beforexOGN = ogn.balanceOf(address(staking));
        assertEq(staking.lockupsCount(alice), 0);

        staking.stake(10 ether, 10 days, alice, false, NEW_STAKE);

        assertEq(staking.lockupsCount(alice), 1);
        assertEq(ogn.balanceOf(alice), beforeOgv - 10 ether);
        assertEq(ogn.balanceOf(address(staking)), beforexOGN + 10 ether);
        assertEq(staking.balanceOf(alice), previewPoints);
        (uint128 lockupAmount, uint128 lockupEnd, uint256 lockupPoints) = staking.lockups(alice, 0);
        assertEq(lockupAmount, 10 ether);
        assertEq(lockupEnd, EPOCH + 10 days);
        assertEq(lockupEnd, previewEnd);
        assertEq(lockupPoints, previewPoints);
        assertEq(staking.accRewardPerShare(), staking.rewardDebtPerShare(alice));

        vm.warp(31 days);
        staking.unstake(0);

        assertEq(staking.lockupsCount(alice), 1);
        assertEq(ogn.balanceOf(alice), beforeOgv);
        assertEq(ogn.balanceOf(address(staking)), 0);
        (lockupAmount, lockupEnd, lockupPoints) = staking.lockups(alice, 0);
        assertEq(lockupAmount, 0);
        assertEq(lockupEnd, 0);
        assertEq(lockupPoints, 0);
        assertEq(staking.accRewardPerShare(), staking.rewardDebtPerShare(alice));
    }

    function testMatchedDurations() public {
        vm.prank(alice);
        staking.stake(10 ether, 100 days, alice, false, NEW_STAKE);

        vm.warp(EPOCH + 90 days);
        vm.prank(bob);
        staking.stake(10 ether, 10 days, bob, false, NEW_STAKE);

        // Now both have 10 OGV staked for 10 days remaining
        // which should mean that they have the same number of points
        assertEq(staking.balanceOf(alice), staking.balanceOf(bob));
    }

    function testPreStaking() public {
        vm.prank(alice);
        staking.stake(100 ether, 100 days, alice, false, NEW_STAKE);

        vm.warp(EPOCH);
        vm.prank(bob);
        staking.stake(100 ether, 100 days, bob, false, NEW_STAKE);

        // Both should have the same points
        assertEq(staking.balanceOf(alice), staking.balanceOf(bob));
    }

    function testZeroStake() public {
        vm.prank(alice);
        vm.expectRevert("Staking: Not enough");
        staking.stake(0 ether, 100 days, alice, false, NEW_STAKE);
    }

    function testStakeTooMuch() public {
        ogn.mint(alice, 1e70);
        vm.prank(alice);
        vm.expectRevert("Staking: Too much");
        staking.stake(1e70, 100 days, alice, false, NEW_STAKE);
    }

    function testStakeTooLong() public {
        vm.prank(alice);
        vm.expectRevert("Staking: Too long");
        staking.stake(1 ether, 1700 days, alice, false, NEW_STAKE);
    }

    function testStakeTooShort() public {
        vm.prank(alice);
        vm.expectRevert("Staking: Too short");
        staking.stake(1 ether, 1 days - 60, alice, false, NEW_STAKE);
    }

    function testExtend() public {
        vm.warp(EPOCH - 5);

        vm.prank(alice);
        staking.stake(100 ether, 100 days, alice, false, NEW_STAKE);

        vm.startPrank(bob);
        staking.stake(100 ether, 10 days, bob, false, NEW_STAKE);
        staking.stake(0, 100 days, bob, false, 0);

        // Both are now locked up for the same amount of time,
        // and should have the same points.
        assertEq(staking.balanceOf(alice), staking.balanceOf(bob), "same balance");

        (uint128 aliceAmount, uint128 aliceEnd, uint256 alicePoints) = staking.lockups(alice, 0);
        (uint128 bobAmount, uint128 bobEnd, uint256 bobPoints) = staking.lockups(bob, 0);
        assertEq(aliceAmount, bobAmount, "same amount");
        assertEq(aliceEnd, bobEnd, "same end");
        assertEq(alicePoints, bobPoints, "same points");
        assertEq(staking.accRewardPerShare(), staking.rewardDebtPerShare(bob));
    }

    function testExtendOnOtherUser() public {
        vm.prank(alice);
        staking.stake(1 ether, 60 days, alice, false, NEW_STAKE);

        vm.expectRevert("Staking: Self only");
        vm.prank(bob);
        staking.stake(1 ether, 60 days, alice, false, 0);

        vm.expectRevert("Staking: Self only");
        vm.prank(bob);
        staking.stake(1 ether, 60 days, alice, true, NEW_STAKE);
    }

    function testExtendOnClosed() public {
        vm.prank(alice);
        staking.stake(1 ether, 60 days, alice, false, NEW_STAKE);
        vm.prank(alice);
        staking.unstake(0);

        vm.expectRevert("Staking: Already closed stake");
        vm.prank(alice);
        staking.stake(1 ether, 80 days, alice, false, 0);
    }

    function testExtendNoChange() public {
        vm.prank(alice);
        staking.stake(1 ether, 60 days, alice, false, NEW_STAKE);

        vm.expectRevert("Staking: Must have increased amount or duration");
        vm.prank(alice);
        staking.stake(0, 60 days, alice, false, 0);
    }

    function testDoubleExtend() public {
        vm.warp(EPOCH + 600 days);

        vm.prank(alice);
        staking.stake(100 ether, 100 days, alice, false, NEW_STAKE);

        vm.startPrank(bob);
        staking.stake(100 ether, 10 days, bob, false, NEW_STAKE);
        staking.stake(0, 50 days, bob, false, 0);
        staking.stake(0, 100 days, bob, false, 0);

        // Both are now locked up for the same amount of time,
        // and should have the same points.
        assertEq(staking.balanceOf(alice), staking.balanceOf(bob));

        (uint128 aliceAmount, uint128 aliceEnd, uint256 alicePoints) = staking.lockups(alice, 0);
        (uint128 bobAmount, uint128 bobEnd, uint256 bobPoints) = staking.lockups(bob, 0);
        assertEq(aliceAmount, bobAmount, "same amount");
        assertEq(aliceEnd, bobEnd, "same end");
        assertEq(alicePoints, bobPoints, "same points");
    }

    function testShortExtendFail() public {
        vm.prank(alice);
        staking.stake(100 ether, 100 days, alice, false, NEW_STAKE);

        vm.startPrank(bob);
        staking.stake(100 ether, 11 days, bob, false, NEW_STAKE);
        vm.expectRevert("Staking: New lockup must not be shorter");
        staking.stake(1 ether, 8 days, bob, false, 0);
    }

    function testExtendWithAddtionalFunds() external {
        vm.prank(alice);
        staking.stake(100 ether, 90 days, alice, false, NEW_STAKE);
        vm.prank(alice);
        staking.stake(100 ether, 100 days, alice, false, 0);

        vm.prank(bob);
        staking.stake(200 ether, 100 days, bob, false, NEW_STAKE);

        // Both should now have the same amount locked up for the same end date
        // which should result in the same stakes
        (uint128 aliceAmount, uint128 aliceEnd, uint256 alicePoints) = staking.lockups(alice, 0);
        (uint128 bobAmount, uint128 bobEnd, uint256 bobPoints) = staking.lockups(bob, 0);
        assertEq(aliceAmount, bobAmount, "same amount");
        assertEq(aliceEnd, bobEnd, "same end");
        assertEq(alicePoints, bobPoints, "same points");
    }

    function testExtendWithRewards() external {
        vm.prank(alice);
        staking.stake(100 ether, 90 days, alice, false, NEW_STAKE);
        ogn.mint(address(source), 100 ether);
        vm.warp(EPOCH - 1);
        vm.prank(alice);
        staking.stake(0 ether, 100 days, alice, true, 0);

        vm.prank(bob);
        staking.stake(200 ether, 100 days, bob, false, NEW_STAKE);

        // Both should now have the same amount locked up for the same end date
        // which should result in the same stakes
        _assertApproxEqualAliceBob();
    }

    function testDoubleStake() external {
        vm.startPrank(alice);

        uint256 beforeOgv = ogn.balanceOf(alice);
        staking.stake(3 ether, 10 days, alice, false, NEW_STAKE);
        uint256 midOgv = ogn.balanceOf(alice);
        uint256 midPoints = staking.balanceOf(alice);
        staking.stake(5 ether, 40 days, alice, false, NEW_STAKE);

        vm.warp(EPOCH + 50 days);
        staking.unstake(1);

        assertEq(midPoints, staking.balanceOf(alice));
        assertEq(midOgv, ogn.balanceOf(alice));

        staking.unstake(0);
        assertEq(0, staking.balanceOf(alice)); // No points, since all unstaked
        assertEq(beforeOgv, ogn.balanceOf(alice)); // All OGV back
    }

    function testCollectRewards() public {
        RewardsSource.Slope[] memory slopes = new RewardsSource.Slope[](3);
        slopes[0].start = uint64(EPOCH);
        slopes[0].ratePerDay = 4 ether;
        slopes[1].start = uint64(EPOCH + 2 days);
        slopes[1].ratePerDay = 2 ether;
        slopes[2].start = uint64(EPOCH + 7 days);
        slopes[2].ratePerDay = 1 ether;
        vm.prank(team);
        source.setInflation(slopes); // Add from start

        vm.startPrank(alice);
        staking.stake(1 ether, 360 days, alice, false, NEW_STAKE);

        vm.warp(EPOCH + 2 days);
        uint256 beforeOgv = ogn.balanceOf(alice);
        uint256 preview = staking.previewRewards(alice);
        staking.collectRewards();
        uint256 afterOgv = ogn.balanceOf(alice);

        uint256 collectedRewards = afterOgv - beforeOgv;
        assertApproxEqAbs(collectedRewards, 8 ether, 1e8, "actual amount should be correct");
        assertEq(collectedRewards, preview, "preview should match actual");
        assertApproxEqAbs(preview, 8 ether, 1e8, "preview amount should be correct");
    }

    function testCollectedRewardsJumpInOut() public {
        RewardsSource.Slope[] memory slopes = new RewardsSource.Slope[](1);
        slopes[0].start = uint64(EPOCH);
        slopes[0].ratePerDay = 2 ether;

        vm.prank(team);
        source.setInflation(slopes);

        vm.prank(alice);
        staking.stake(1 ether, 10 days, alice, false, NEW_STAKE);

        // One day later
        vm.warp(EPOCH + 1 days);
        vm.prank(alice);
        staking.collectRewards(); // Alice collects

        vm.prank(bob);
        staking.stake(1 ether, 9 days, bob, false, NEW_STAKE); // Bob stakes

        vm.warp(EPOCH + 2 days); // Alice and bob should split rewards evenly
        uint256 aliceBefore = ogn.balanceOf(alice);
        uint256 bobBefore = ogn.balanceOf(bob);
        vm.prank(alice);
        staking.collectRewards(); // Alice collects
        vm.prank(bob);
        staking.collectRewards(); // Bob collects
        assertEq(ogn.balanceOf(alice) - aliceBefore, ogn.balanceOf(bob) - bobBefore);
    }

    function testMultipleUnstake() public {
        vm.startPrank(alice);
        staking.stake(1 ether, 10 days, alice, false, NEW_STAKE);
        vm.warp(EPOCH + 11 days);
        staking.unstake(0);
        vm.expectRevert("Staking: Already unstaked this lockup");
        staking.unstake(0);
    }

    function testUnstakeNeverStaked() public {
        vm.startPrank(alice);
        vm.expectRevert();
        staking.unstake(0);
    }

    function testEarlyUnstake() public {
        vm.startPrank(alice);
        vm.warp(EPOCH);
        staking.stake(1 ether, 200 days, alice, false, NEW_STAKE);

        vm.warp(EPOCH + 100 days);
        uint256 before = ogn.balanceOf(alice);
        uint256 beforeCollected = ogn.balanceOf(address(source));
        uint256 expectedWithdraw = staking.previewWithdraw(1 ether, EPOCH + 200 days);

        staking.unstake(0);

        uint256 returnAmount = ogn.balanceOf(alice) - before;
        assertEq(returnAmount, 911937178579591520);
        assertEq(expectedWithdraw, returnAmount);
        uint256 penaltyCollected = ogn.balanceOf(address(source)) - beforeCollected;
        assertEq(penaltyCollected, 1 ether - 911937178579591520);
    }

    function testCollectRewardsOnExpand() public {
        RewardsSource.Slope[] memory slopes = new RewardsSource.Slope[](1);
        slopes[0].start = uint64(EPOCH);
        slopes[0].ratePerDay = 2 ether;

        vm.prank(team);
        source.setInflation(slopes);

        vm.prank(alice);
        staking.stake(1 ether, 10 days, alice, false, NEW_STAKE);
        vm.prank(bob);
        staking.stake(1 ether, 10 days, bob, false, NEW_STAKE);

        vm.warp(EPOCH + 6 days);

        vm.prank(bob);
        staking.collectRewards();
        vm.prank(alice);
        staking.stake(0, 10 days, alice, false, 0);

        assertEq(ogn.balanceOf(alice), ogn.balanceOf(bob));
    }

    function testNoSupplyShortCircuts() public {
        uint256 beforeAlice = ogn.balanceOf(alice);

        vm.prank(alice);
        staking.previewRewards(alice);
        assertEq(ogn.balanceOf(alice), beforeAlice);

        vm.prank(alice);
        staking.collectRewards();
        assertEq(ogn.balanceOf(alice), beforeAlice);

        vm.prank(bob);
        staking.stake(1 ether, 9 days, bob, false, NEW_STAKE);

        vm.prank(alice);
        staking.previewRewards(alice);
        assertEq(ogn.balanceOf(alice), beforeAlice);

        vm.prank(alice);
        staking.collectRewards();
        assertEq(ogn.balanceOf(alice), beforeAlice);
    }

    function testMultipleStakesSameBlock() public {
        RewardsSource.Slope[] memory slopes = new RewardsSource.Slope[](3);
        slopes[0].start = uint64(EPOCH);
        slopes[0].ratePerDay = 4 ether;
        slopes[1].start = uint64(EPOCH + 2 days);
        slopes[1].ratePerDay = 2 ether;
        slopes[2].start = uint64(EPOCH + 7 days);
        slopes[2].ratePerDay = 1 ether;
        vm.prank(team);
        source.setInflation(slopes); // Add from start

        vm.prank(alice);
        staking.stake(1 ether, 360 days, alice, false, NEW_STAKE);

        vm.warp(EPOCH + 9 days);

        vm.prank(alice);
        staking.stake(1 ether, 60 days, alice, false, NEW_STAKE);
        vm.prank(bob);
        staking.stake(1 ether, 90 days, bob, false, NEW_STAKE);
        vm.prank(alice);
        staking.stake(1 ether, 180 days, alice, false, NEW_STAKE);
        vm.prank(bob);
        staking.stake(1 ether, 240 days, bob, false, NEW_STAKE);
        vm.prank(alice);
        staking.stake(1 ether, 360 days, alice, false, NEW_STAKE);
        vm.prank(alice);
        staking.collectRewards();
        vm.prank(alice);
        staking.collectRewards();
    }

    function testZeroSupplyRewardDebtPerShare() public {
        RewardsSource.Slope[] memory slopes = new RewardsSource.Slope[](1);
        slopes[0].start = uint64(EPOCH);
        slopes[0].ratePerDay = 2 ether;
        vm.prank(team);
        source.setInflation(slopes);

        vm.prank(alice);
        staking.stake(1 ether, 10 days, alice, false, NEW_STAKE);
        vm.prank(bob);
        staking.stake(1 ether, 10 days, bob, false, NEW_STAKE);

        // Alice will unstake, setting her rewardDebtPerShare
        vm.warp(EPOCH + 10 days);
        vm.prank(alice);
        staking.unstake(0);

        // Bob unstakes, setting the total supply to zero
        vm.warp(EPOCH + 20 days);
        vm.prank(bob);
        staking.unstake(0);

        // Alice stakes.
        //   Even with the total supply being zero, it is important that
        //   Alice's rewardDebtPerShare per share be set to match the accRewardPerShare
        vm.prank(alice);
        staking.stake(1 ether, 10 days, alice, false, NEW_STAKE);

        // Alice unstakes later.
        //   If rewardDebtPerShare was wrong, this will fail because she will
        //   try to collect more OGV than the contract has
        vm.warp(EPOCH + 30 days);
        vm.prank(alice);
        staking.unstake(1);
    }

    function testFuzzCanAlwaysWithdraw(uint96 amountA, uint96 amountB, uint64 durationA, uint64 durationB, uint64 start)
        public
    {
        uint256 HUNDRED_YEARS = 100 * 366 days;
        uint256 LAST_START = HUNDRED_YEARS - 366 days;
        vm.warp(start % LAST_START);

        durationA = durationA % uint64(365 days);
        durationB = durationB % uint64(365 days);
        if (durationA < 7 days) {
            durationA = 7 days;
        }
        if (durationB < 7 days) {
            durationB = 7 days;
        }
        if (amountA < 1) {
            amountA = 1;
        }
        if (amountB < 1) {
            amountB = 1;
        }

        RewardsSource.Slope[] memory slopes = new RewardsSource.Slope[](1);
        slopes[0].start = uint64(EPOCH);
        slopes[0].ratePerDay = 2 ether;
        vm.prank(team);
        source.setInflation(slopes);

        vm.prank(alice);
        ogn.mint(alice, amountA);
        vm.prank(alice);
        ogn.approve(address(staking), amountA);
        assertEq(staking.balanceOf(alice), 0);
        // preview check
        (uint256 expectedPoints,) = staking.previewPoints(amountA, durationA);
        vm.prank(alice);
        staking.stake(amountA, durationA, alice, false, NEW_STAKE);
        assertEq(staking.balanceOf(alice), expectedPoints);

        vm.prank(bob);
        ogn.mint(bob, amountB);
        vm.prank(bob);
        ogn.approve(address(staking), amountB);
        vm.prank(bob);
        staking.stake(amountB, durationB, bob, false, NEW_STAKE);

        vm.warp(HUNDRED_YEARS);
        vm.prank(alice);
        staking.unstake(0);
        vm.prank(bob);
        staking.unstake(0);
    }

    function testFuzzSemiSanePowerFunction(uint256 start) public {
        uint256 HUNDRED_YEARS = 100 * 366 days;
        start = start % HUNDRED_YEARS;
        vm.warp(start);
        vm.prank(bob);
        staking.stake(1e18, 10 days, bob, false, NEW_STAKE);
        uint256 y = (356 days + start + 10 days) / 365 days;
        uint256 maxPoints = 2 ** y * 1e18;
        assertLt(staking.balanceOf(bob), maxPoints);
    }

    function _assertApproxEqualAliceBob() internal {
        // Both should now have the same amount locked up for the same end date
        // which should result in the same stakes
        (uint128 aliceAmount, uint128 aliceEnd, uint256 alicePoints) = staking.lockups(alice, 0);
        (uint128 bobAmount, uint128 bobEnd, uint256 bobPoints) = staking.lockups(bob, 0);
        assertLt(aliceAmount, bobAmount * 100001 / 100000, "same amount");
        assertLt(aliceEnd, bobEnd * 100001 / 100000, "same end");
        assertLt(alicePoints, bobPoints * 100001 / 100000, "same points");

        assertGt(aliceAmount, bobAmount * 99999 / 100000, "same amount");
        assertGt(aliceEnd, bobEnd * 99999 / 100000, "same end");
        assertGt(alicePoints, bobPoints * 99999 / 100000, "same points");
    }
}
