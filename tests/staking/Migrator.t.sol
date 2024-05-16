import "forge-std/Test.sol";

import "contracts/Migrator.sol";

import "contracts/OgvStaking.sol";
import "contracts/ExponentialStaking.sol";

import "contracts/upgrades/MigratorProxy.sol";

import "contracts/tests/MockOGN.sol";
import "contracts/tests/MockRewardsSource.sol";
import "contracts/tests/MockOGV.sol";
import "contracts/tests/MockOGVStaking.sol";

contract MigratorTest is Test {
    MockOGV ogv;
    MockOGN ogn;

    Migrator migrator;

    ExponentialStaking ognStaking;
    MockOGVStaking ogvStaking;

    MockRewardsSource source;

    address alice = address(0x42);
    address bob = address(0x43);
    address governor = address(0x44);

    uint256 constant EPOCH = 1 days;
    uint256 constant MIN_STAKE_DURATION = 7 days;
    int256 constant NEW_STAKE = -1;

    function setUp() public {
        vm.startPrank(governor);
        ogv = new MockOGV();
        ogn = new MockOGN();

        source = new MockRewardsSource();

        MigratorProxy mProxy = new MigratorProxy();

        ognStaking = new ExponentialStaking(address(ogn), EPOCH, MIN_STAKE_DURATION, address(source));

        ogvStaking = new MockOGVStaking(address(ogv), EPOCH, MIN_STAKE_DURATION, address(source), address(mProxy));

        migrator = new Migrator(address(ogv), address(ogn), address(ogvStaking), address(ognStaking));
        mProxy.initialize(address(migrator), governor, "");
        migrator = Migrator(address(mProxy));

        // Make sure contract has enough OGN for migration
        ogn.mint(address(migrator), 10000000 ether);

        // Users have enough OGV
        ogv.mint(alice, 10000000 ether);
        ogv.mint(bob, 10000000 ether);
        ogv.mint(address(ogvStaking), 10000000 ether);

        // Begin migration
        migrator.start();

        migrator.transferExcessTokens(governor);

        vm.stopPrank();

        // ... with allowance for Migrator
        vm.startPrank(alice);
        ogv.approve(address(migrator), type(uint256).max);
        ogn.approve(address(migrator), type(uint256).max);
        ogv.approve(address(ogvStaking), type(uint256).max);
        vm.stopPrank();

        vm.startPrank(bob);
        ogv.approve(address(migrator), type(uint256).max);
        ogn.approve(address(migrator), type(uint256).max);
        ogv.approve(address(ogvStaking), type(uint256).max);
        vm.stopPrank();
    }

    function testBalanceMigration() public {
        uint256 maxOgnAmount = ogn.balanceOf(address(migrator));
        uint256 ogvSupply = ogv.totalSupply();

        vm.startPrank(alice);
        migrator.migrate(100 ether);
        vm.stopPrank();

        assertEq(ogv.balanceOf(alice), 10000000 ether - 100 ether, "More OGV burnt");
        assertEq(ogv.totalSupply(), ogvSupply - 100 ether, "OGV supply mismatch");

        assertEq(ogn.balanceOf(alice), 9.137 ether, "Less OGN received");
        assertEq(ogn.balanceOf(address(migrator)), maxOgnAmount - 9.137 ether, "More OGN sent");
    }

    function testDustBalanceMigration() public {
        vm.startPrank(alice);
        migrator.migrate(1);
        vm.stopPrank();
    }

    function testBurnOnDecomission() public {
        uint256 maxOgnAmount = ogn.balanceOf(address(migrator));

        vm.startPrank(alice);
        migrator.migrate(1 ether);
        vm.stopPrank();

        vm.warp(migrator.endTime() + 100);

        migrator.decommission();

        assertEq(ogn.balanceOf(address(migrator)), 0 ether, "OGN leftover");
        assertEq(ogn.balanceOf(address(0xdead)), maxOgnAmount - 0.09137 ether, "OGN not sent to burn address");
    }

    function testSolvencyDuringMigrate() public {
        uint256 maxOgnAmount = ogn.balanceOf(address(migrator));

        vm.startPrank(alice);
        ogn.setNetTransferAmount(100 ether);
        vm.expectRevert(
            abi.encodeWithSelector(
                bytes4(keccak256("ContractInsolvent(uint256,uint256)")),
                maxOgnAmount - 0.09137 ether,
                maxOgnAmount - 100 ether
            )
        );
        migrator.migrate(1 ether);

        ogn.setNetTransferAmount(0.09138 ether);
        vm.expectRevert(
            abi.encodeWithSelector(
                bytes4(keccak256("ContractInsolvent(uint256,uint256)")),
                maxOgnAmount - 0.09137 ether,
                maxOgnAmount - 0.09138 ether
            )
        );
        migrator.migrate(1 ether);

        ogn.setNetTransferAmount(0.091371115 ether);
        vm.expectRevert(
            abi.encodeWithSelector(
                bytes4(keccak256("ContractInsolvent(uint256,uint256)")),
                maxOgnAmount - 0.09137 ether,
                maxOgnAmount - 0.091371115 ether
            )
        );
        migrator.migrate(1 ether);

        vm.stopPrank();
    }

    function testMigrateAfterTimelimit() public {
        // Should allow migration even after timelimit
        // but before decommission
        vm.startPrank(alice);
        ogvStaking.mockStake(10000 ether, 365 days);

        vm.warp(migrator.endTime() + 100);

        assertEq(migrator.isMigrationActive(), false, "Migration state not changed");

        migrator.migrate(1 ether);
        uint256[] memory ids = new uint256[](1);
        ids[0] = 0;
        migrator.migrate(ids, 0, 0, false, 0, 0);
        vm.stopPrank();
    }

    function testRevertDecommissionBeforeEnd() public {
        vm.warp(migrator.endTime() - 1000);

        vm.expectRevert(bytes4(keccak256("MigrationNotComplete()")));
        migrator.decommission();
    }

    function testRevertDecommissionBeforeStart() public {
        Migrator newMigrator = new Migrator(address(ogv), address(ogn), address(1), address(1));

        vm.expectRevert(bytes4(keccak256("MigrationNotComplete()")));
        newMigrator.decommission();
    }

    function testMigrateStakes() public {
        vm.startPrank(alice);
        ogvStaking.mockStake(10000 ether, 365 days);
        ogvStaking.mockStake(1000 ether, 20 days);

        uint256[] memory lockupIds = new uint256[](2);
        lockupIds[0] = 0;
        lockupIds[1] = 1;

        uint256 stakeAmount = (11000 ether * 0.09137 ether) / 1 ether;

        migrator.migrate(lockupIds, 0, 0, false, stakeAmount, 300 days);

        // Should have merged it in a single OGN lockup
        (uint128 amount, uint128 end, uint256 points) = ognStaking.lockups(alice, 0);
        assertEq(amount, stakeAmount, "Lockup not migrated");

        vm.expectRevert();
        (amount, end, points) = ognStaking.lockups(alice, 1);

        // Should have removed OGV staked
        for (uint256 i = 0; i < lockupIds.length; ++i) {
            (amount, end, points) = ogvStaking.lockups(alice, lockupIds[i]);
            assertEq(amount, 0, "Lockup still exists");
            assertEq(end, 0, "Lockup still exists");
            assertEq(points, 0, "Lockup still exists");
        }

        vm.stopPrank();
    }

    function testMigrateSelectedStakes() public {
        vm.startPrank(alice);
        ogvStaking.mockStake(10000 ether, 365 days);
        ogvStaking.mockStake(1000 ether, 20 days);

        uint256[] memory lockupIds = new uint256[](1);
        lockupIds[0] = 0;

        uint256 stakeAmount = (10000 ether * 0.09137 ether) / 1 ether;

        migrator.migrate(lockupIds, 0, 0, false, stakeAmount, 300 days);

        // Should have merged it in a single OGN lockup
        (uint128 amount, uint128 end, uint256 points) = ognStaking.lockups(alice, 0);
        assertEq(amount, stakeAmount, "Lockup not migrated");

        vm.expectRevert();
        (amount, end, points) = ognStaking.lockups(alice, 1);

        // Should have removed OGV staked
        for (uint256 i = 0; i < lockupIds.length; ++i) {
            (amount, end, points) = ogvStaking.lockups(alice, lockupIds[i]);
            assertEq(amount, 0, "Lockup still exists");
            assertEq(end, 0, "Lockup still exists");
            assertEq(points, 0, "Lockup still exists");
        }

        // Shouldn't have deleted other migration
        (amount, end, points) = ogvStaking.lockups(alice, 1);
        assertEq(amount, 1000 ether, "Other lockup deleted");

        vm.stopPrank();
    }

    function testMigrateStakesWithOGVBalance() public {
        vm.startPrank(alice);
        ogvStaking.mockStake(10000 ether, 365 days);
        ogvStaking.mockStake(1000 ether, 20 days);

        uint256 balanceBefore = ogv.balanceOf(alice);

        uint256[] memory lockupIds = new uint256[](2);
        lockupIds[0] = 0;
        lockupIds[1] = 1;

        uint256 stakeAmount = (11500 ether * 0.09137 ether) / 1 ether;

        migrator.migrate(lockupIds, 500 ether, 0, false, stakeAmount, 300 days);

        // Should have merged it in a single OGN lockup
        (uint128 amount, uint128 end, uint256 points) = ognStaking.lockups(alice, 0);
        assertEq(amount, stakeAmount, "Lockup not migrated");

        // Should have updated balance correctly
        assertEq(ogv.balanceOf(alice), balanceBefore - 500 ether, "Balance mismatch");

        vm.expectRevert();
        (amount, end, points) = ognStaking.lockups(alice, 1);

        // Should have removed OGV staked
        for (uint256 i = 0; i < lockupIds.length; ++i) {
            (amount, end, points) = ogvStaking.lockups(alice, lockupIds[i]);
            assertEq(amount, 0, "Lockup still exists");
            assertEq(end, 0, "Lockup still exists");
            assertEq(points, 0, "Lockup still exists");
        }

        vm.stopPrank();
    }

    function testMigrateRevertOnEmptyLockups() public {
        vm.startPrank(alice);
        uint256[] memory lockupIds = new uint256[](0);

        vm.expectRevert(bytes4(keccak256("LockupIdsRequired()")));
        migrator.migrate(lockupIds, 500 ether, 0, false, 9000 ether, 300 days);

        vm.stopPrank();
    }

    function testMigrateWithRewards() public {
        vm.startPrank(alice);
        ogvStaking.mockStake(10000 ether, 365 days);
        ogvStaking.mockStake(1000 ether, 20 days);

        uint256[] memory lockupIds = new uint256[](2);
        lockupIds[0] = 0;
        lockupIds[1] = 1;

        // Arbitrary reward
        ogvStaking.setRewardShare(2 * 1e11);
        uint256 expectedRewards = ogvStaking.previewRewards(alice);
        uint256 stakeAmount = ((11000 ether + expectedRewards) * 0.09137 ether) / 1 ether;

        migrator.migrate(
            lockupIds,
            0,
            0,
            true, // Include reward as well
            stakeAmount,
            300 days
        );

        // Should have merged it in a single OGN lockup
        (uint128 amount, uint128 end, uint256 points) = ognStaking.lockups(alice, 0);
        assertEq(amount, stakeAmount, "Lockup not migrated");

        vm.expectRevert();
        (amount, end, points) = ognStaking.lockups(alice, 1);

        // Should have removed OGV staked
        for (uint256 i = 0; i < lockupIds.length; ++i) {
            (amount, end, points) = ogvStaking.lockups(alice, lockupIds[i]);
            assertEq(amount, 0, "Lockup still exists");
            assertEq(end, 0, "Lockup still exists");
            assertEq(points, 0, "Lockup still exists");
        }

        vm.stopPrank();
    }

    function testMigrateStakesWithOGNBalance() public {
        vm.startPrank(alice);
        ogvStaking.mockStake(10000 ether, 365 days);
        ogvStaking.mockStake(1000 ether, 20 days);

        ogn.mint(alice, 500 ether);

        uint256 ognBalanceBefore = ogn.balanceOf(alice);

        uint256[] memory lockupIds = new uint256[](2);
        lockupIds[0] = 0;
        lockupIds[1] = 1;

        uint256 stakeAmount = ognBalanceBefore + ((11000 ether * 0.09137 ether) / 1 ether);

        migrator.migrate(lockupIds, 0, 500 ether, false, stakeAmount, 300 days);

        // Should have merged it in a single OGN lockup
        (uint128 amount, uint128 end, uint256 points) = ognStaking.lockups(alice, 0);
        assertEq(amount, stakeAmount, "Lockup not migrated");

        // Should have updated balance correctly
        assertEq(ogn.balanceOf(alice), 0, "OGN Balance mismatch");

        vm.expectRevert();
        (amount, end, points) = ognStaking.lockups(alice, 1);

        // Should have removed OGV staked
        for (uint256 i = 0; i < lockupIds.length; ++i) {
            (amount, end, points) = ogvStaking.lockups(alice, lockupIds[i]);
            assertEq(amount, 0, "Lockup still exists");
            assertEq(end, 0, "Lockup still exists");
            assertEq(points, 0, "Lockup still exists");
        }

        vm.stopPrank();
    }

    function testMigrateStakesWithOGNAndOGVBalances() public {
        vm.startPrank(alice);
        ogvStaking.mockStake(10000 ether, 365 days);
        ogvStaking.mockStake(1000 ether, 20 days);

        ogn.mint(alice, 500 ether);

        uint256 ognBalanceBefore = ogn.balanceOf(alice);
        uint256 ogvBalanceBefore = ogv.balanceOf(alice);

        uint256[] memory lockupIds = new uint256[](2);
        lockupIds[0] = 0;
        lockupIds[1] = 1;

        uint256 stakeAmount = ognBalanceBefore + ((11500 ether * 0.09137 ether) / 1 ether);

        migrator.migrate(lockupIds, 500 ether, ognBalanceBefore, false, stakeAmount, 300 days);

        // Should have merged it in a single OGN lockup
        (uint128 amount, uint128 end, uint256 points) = ognStaking.lockups(alice, 0);
        assertEq(amount, stakeAmount, "Lockup not migrated");

        // Should have updated balance correctly
        assertEq(ogn.balanceOf(alice), 0, "OGN Balance mismatch");
        assertEq(ogv.balanceOf(alice), ogvBalanceBefore - 500 ether, "OGN Balance mismatch");

        vm.expectRevert();
        (amount, end, points) = ognStaking.lockups(alice, 1);

        // Should have removed OGV staked
        for (uint256 i = 0; i < lockupIds.length; ++i) {
            (amount, end, points) = ogvStaking.lockups(alice, lockupIds[i]);
            assertEq(amount, 0, "Lockup still exists");
            assertEq(end, 0, "Lockup still exists");
            assertEq(points, 0, "Lockup still exists");
        }

        vm.stopPrank();
    }
}
