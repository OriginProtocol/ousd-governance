import "forge-std/Test.sol";
import "../../contracts/upgrades/RewardsSourceProxy.sol";
import "../../contracts/RewardsSource.sol";
import "../../contracts/tests/MockOgv.sol";

contract RewardsSourceTest is Test {
    MockOgv ogv;
    RewardsSource rewards;

    address staking = address(0x42);
    address team = address(0x43);
    address alice = address(0x44);

    uint256 constant EPOCH = 1 days;

    event InflationChanged();
    event RewardsTargetChange(address target, address previousTarget);

    function setUp() public {
        vm.startPrank(team);
        ogv = new MockOgv();
        rewards = new RewardsSource(address(ogv));

        // Setup Rewards Proxy
        RewardsSourceProxy rewardsProxy = new RewardsSourceProxy();
        rewardsProxy.initialize(address(rewards), team, '');
        rewards = RewardsSource(address(rewardsProxy));
        // Configure Rewards
        rewards.setRewardsTarget(address(staking));
        vm.stopPrank();
    }

    function testRewardSlopes() public {
        vm.prank(team);
        RewardsSource.Slope[] memory slopes = new RewardsSource.Slope[](3);
        slopes[0].start = uint64(EPOCH);
        slopes[0].ratePerDay = 4 ether;
        slopes[0].end = type(uint64).max; // Test that it's ignored
        slopes[1].start = uint64(EPOCH + 2 days);
        slopes[1].ratePerDay = 2 ether;
        slopes[1].end = type(uint64).max; // Test that it's ignored
        slopes[2].start = uint64(EPOCH + 7 days);
        slopes[2].ratePerDay = 1 ether;
        slopes[2].end = 0; // Test that it's ignored
        vm.expectEmit(false, false, false, false);
        emit InflationChanged();
        rewards.setInflation(slopes);

        vm.startPrank(staking);
        vm.warp(EPOCH - 1000);
        assertEq(rewards.collectRewards(), 0 ether, "a");

        vm.warp(EPOCH + 1 days);
        assertEq(rewards.collectRewards(), 4 ether, "b");

        vm.warp(EPOCH + 2 days);
        assertEq(rewards.collectRewards(), 4 ether, "c");

        vm.warp(EPOCH + 3 days);
        assertEq(rewards.collectRewards(), 2 ether, "d");

        vm.warp(EPOCH + 4 days);
        assertEq(rewards.collectRewards(), 2 ether, "e");

        vm.warp(EPOCH + 8 days);
        assertEq(rewards.collectRewards(), (6 ether + 1 ether), "f");

        vm.warp(EPOCH + 9 days);
        assertEq(rewards.collectRewards(), (1 ether), "g");

        vm.warp(EPOCH + 10 days);
        assertEq(rewards.collectRewards(), (1 ether), "h");

        vm.warp(EPOCH + 11 days);
        assertEq(rewards.collectRewards(), (1 ether), "i");

        vm.warp(EPOCH + 12 days);
        assertEq(rewards.collectRewards(), (1 ether), "j");

        vm.warp(EPOCH + 13 days);
        assertEq(rewards.collectRewards(), (1 ether), "k");

        vm.warp(EPOCH + 14 days);
        assertEq(rewards.collectRewards(), (1 ether), "l");

        vm.warp(EPOCH + 15 days);
        assertEq(rewards.collectRewards(), (1 ether), "m");
    }

    function testRewardSlopesSegmentOverlap() public {
        vm.prank(team);
        RewardsSource.Slope[] memory slopes = new RewardsSource.Slope[](3);
        slopes[0].start = uint64(EPOCH);
        slopes[0].ratePerDay = 4 ether;
        slopes[1].start = uint64(EPOCH + 2 days);
        slopes[1].ratePerDay = 2 ether;
        slopes[2].start = uint64(EPOCH + 7 days);
        slopes[2].ratePerDay = 1 ether;
        rewards.setInflation(slopes);

        vm.startPrank(staking);
        vm.warp(EPOCH - 1000);
        assertEq(rewards.collectRewards(), 0 ether, "a");

        // 2x4 + 5x2 + 8x1 ==
        vm.warp(EPOCH + 15 days);
        assertEq(rewards.collectRewards(), (26 ether), "m");
    }

    function testRewardSlopesStartInside() public {
        vm.prank(team);
        RewardsSource.Slope[] memory slopes = new RewardsSource.Slope[](3);
        slopes[0].start = uint64(1 days / 2);
        slopes[0].ratePerDay = 4 ether;
        slopes[1].start = uint64(EPOCH + 2 days);
        slopes[1].ratePerDay = 2 ether;
        slopes[2].start = uint64(EPOCH + 7 days);
        slopes[2].ratePerDay = 1 ether;
        rewards.setInflation(slopes);

        vm.startPrank(staking);
        assertEq(rewards.collectRewards(), 0 ether, "a");
        vm.warp(EPOCH);
        assertEq(rewards.collectRewards(), 2 ether, "b");
    }

    function testBackInTime() public {
        vm.prank(team);
        RewardsSource.Slope[] memory slopes = new RewardsSource.Slope[](3);
        slopes[0].start = uint64(1 days / 2);
        slopes[0].ratePerDay = 4 ether;
        slopes[1].start = uint64(EPOCH + 2 days);
        slopes[1].ratePerDay = 2 ether;
        slopes[2].start = uint64(EPOCH + 7 days);
        slopes[2].ratePerDay = 1 ether;
        rewards.setInflation(slopes);

        vm.startPrank(staking);
        assertEq(rewards.collectRewards(), 0 ether, "a");
        vm.warp(EPOCH);
        assertEq(rewards.collectRewards(), 2 ether, "b");
        vm.warp(EPOCH - 1 days / 2); // Back in time
        assertEq(rewards.collectRewards(), 0 ether, "b");
    }

    function testRewardSlopesNoSlopes() public {
        vm.prank(team);
        RewardsSource.Slope[] memory someSlopes = new RewardsSource.Slope[](1);
        someSlopes[0].start = uint64(1 days / 2);
        someSlopes[0].ratePerDay = 4 ether;
        rewards.setInflation(someSlopes);

        vm.prank(team);
        RewardsSource.Slope[] memory noSlopes = new RewardsSource.Slope[](0);
        rewards.setInflation(noSlopes);

        vm.startPrank(staking);
        assertEq(rewards.collectRewards(), 0 ether, "a");
        vm.warp(EPOCH + 2 days);
        assertEq(rewards.collectRewards(), 0 ether, "b");
    }

    function testRewardSlopesTooManySlopes() public {
        vm.prank(team);
        vm.expectRevert("Rewards: Too many slopes");
        RewardsSource.Slope[] memory slopes = new RewardsSource.Slope[](65);
        rewards.setInflation(slopes);
    }

    function testNonPublicSetInflation() public {
        RewardsSource.Slope[] memory slopes = new RewardsSource.Slope[](0);
        vm.prank(alice);
        vm.expectRevert("Caller is not the Governor");
        rewards.setInflation(slopes);
    }

    function testNoPublicCollect() public {
        RewardsSource.Slope[] memory slopes = new RewardsSource.Slope[](0);
        vm.prank(team);
        rewards.setInflation(slopes);
        vm.prank(alice);
        vm.expectRevert("Rewards: Not rewardsTarget");
        rewards.collectRewards();
    }

    function testNonIncreasingSlopes() public {
        vm.prank(team);
        RewardsSource.Slope[] memory slopes = new RewardsSource.Slope[](3);
        slopes[0].start = uint64(EPOCH);
        slopes[1].start = uint64(EPOCH - 1);
        slopes[2].start = uint64(EPOCH + 2);

        vm.expectRevert("Rewards: Start times must increase");
        rewards.setInflation(slopes);
    }

    function testTooMuchInflation() public {
        vm.prank(team);
        RewardsSource.Slope[] memory slopes = new RewardsSource.Slope[](1);
        slopes[0].start = uint64(EPOCH);
        slopes[0].ratePerDay = 2000000000000 ether;

        vm.expectRevert("Rewards: RatePerDay too high");
        rewards.setInflation(slopes);
    }

    function testSetRewardsTarget() public {
        vm.prank(team);
        vm.expectEmit(false, false, false, true);
        emit RewardsTargetChange(address(0), address(staking));
        rewards.setRewardsTarget(address(0));
        assertEq(rewards.rewardsTarget(), address(0));
    }

    function testPreviewRewards() public {
        vm.prank(team);
        RewardsSource.Slope[] memory slopes = new RewardsSource.Slope[](3);
        slopes[0].start = uint64(EPOCH);
        slopes[0].ratePerDay = 4 ether;
        slopes[1].start = uint64(EPOCH + 2 days);
        slopes[1].ratePerDay = 2 ether;
        slopes[2].start = uint64(EPOCH + 7 days);
        slopes[2].ratePerDay = 1 ether;
        rewards.setInflation(slopes);

        // Simulate OGV from Buyback contract
        ogv.mint(address(rewards), 13 ether);

        vm.startPrank(staking);
        vm.warp(EPOCH - 1000);
        // 0 + 13 ==
        assertEq(rewards.previewRewards(), 13 ether, "a");

        // Simulate OGV from Buyback contract
        ogv.mint(address(rewards), 11 ether);

        // 2x4 + 5x2 + 8x1 + 13 + 11 ==
        vm.warp(EPOCH + 15 days);
        assertEq(rewards.previewRewards(), (50 ether), "m");
    }
}
