// SPDX-License-Identifier: MIT

pragma solidity 0.8.10;

import "forge-std/Test.sol";

import {Addresses} from "contracts/utils/Addresses.sol";
import {DeployManager} from "script/deploy/DeployManager.sol";

import {Migrator} from "contracts/Migrator.sol";
import {OgvStaking} from "contracts/OgvStaking.sol";
import {ExponentialStaking} from "contracts/ExponentialStaking.sol";

import {IMintableERC20} from "contracts/interfaces/IMintableERC20.sol";

contract MigratorForkTest is Test {
    DeployManager public deployManager;

    Migrator public migrator;
    OgvStaking public veogv;
    ExponentialStaking public xogn;
    IMintableERC20 public ogv;
    IMintableERC20 public ogn;

    uint256 constant OGN_EPOCH = 1717041600; // May 30, 2024 GMT
    address public ogvWhale = 0x70fCE97d671E81080CA3ab4cc7A59aAc2E117137;

    constructor() {
        deployManager = new DeployManager();

        deployManager.setUp();
        deployManager.run();
    }

    function setUp() external {
        migrator = Migrator(deployManager.getDeployment("MIGRATOR"));

        veogv = OgvStaking(Addresses.VEOGV);
        ogv = IMintableERC20(Addresses.OGV);
        ogn = IMintableERC20(Addresses.OGN);
        xogn = ExponentialStaking(deployManager.getDeployment("XOGN"));

        vm.startPrank(ogvWhale);
        ogv.approve(address(migrator), type(uint256).max);
        ogn.approve(address(migrator), type(uint256).max);
        ogv.approve(address(veogv), type(uint256).max);
        vm.stopPrank();

        vm.warp(OGN_EPOCH + 100 days);

        if (veogv.balanceOf(ogvWhale) == 0) {
            revert("Change OGV Whale address");
        }
    }

    function testBalanceMigration() external {
        vm.startPrank(ogvWhale);

        uint256 migratorOGNReserve = ogn.balanceOf(address(migrator));
        uint256 ogvSupply = ogv.totalSupply();
        uint256 ogvBalanceBefore = ogv.balanceOf(ogvWhale);
        uint256 ognBalanceBefore = ogn.balanceOf(ogvWhale);

        // Should be able to swap OGV to OGN at fixed rate
        migrator.migrate(100 ether);

        assertEq(ogv.balanceOf(ogvWhale), ogvBalanceBefore - 100 ether, "More OGV burnt");
        assertEq(ogv.totalSupply(), ogvSupply - 100 ether, "OGV supply mismatch");

        assertEq(ogn.balanceOf(ogvWhale), ognBalanceBefore + 9.137 ether, "Less OGN received");
        assertEq(ogn.balanceOf(address(migrator)), migratorOGNReserve - 9.137 ether, "More OGN sent");

        vm.stopPrank();
    }

    function testDustBalanceMigration() public {
        vm.startPrank(ogvWhale);
        migrator.migrate(1);
        vm.stopPrank();
    }

    function testUnstakingOGVLockups() public {
        vm.startPrank(ogvWhale);

        // Collect rewards
        veogv.collectRewards();

        uint256 migratorOGNReserve = ogn.balanceOf(address(migrator));
        uint256 ogvSupply = ogv.totalSupply();
        uint256 ogvBalanceBefore = ogv.balanceOf(ogvWhale);
        uint256 ognBalanceBefore = ogn.balanceOf(ogvWhale);

        (uint128 amount, uint128 end, uint256 points) = veogv.lockups(ogvWhale, 13);
        uint256 ognTransferred = (amount * 9137e8) / 1e13;

        uint256[] memory lockupIds = new uint256[](1);
        lockupIds[0] = 2;
        migrator.migrate(lockupIds, 0, 0, false, 0, 0);
        assertEq(ogv.totalSupply(), ogvSupply - amount, "OGV supply mismatch");
        assertEq(ogn.balanceOf(address(migrator)), migratorOGNReserve - ognTransferred, "OGN reserve balance mismatch");
        assertEq(ogv.balanceOf(ogvWhale), ogvBalanceBefore, "Change in OGV balance");
        assertEq(ogn.balanceOf(ogvWhale), ognBalanceBefore + ognTransferred, "No change in OGN balance");

        (amount, end, points) = veogv.lockups(ogvWhale, 2);
        assertEq(amount, 0, "Amount: Lockup still exists");
        assertEq(end, 0, "End: Lockup still exists");
        assertEq(points, 0, "Points: Lockup still exists");

        vm.stopPrank();
    }

    function testMigrateSelectedStakes() public {
        vm.startPrank(ogvWhale);

        uint256[] memory lockupIds = new uint256[](1);
        lockupIds[0] = 2;

        (uint128 amount, uint128 end, uint256 points) = veogv.lockups(ogvWhale, 13);

        uint256 stakeAmount = (amount * 9137e8) / 1e13;

        migrator.migrate(lockupIds, 0, 0, false, stakeAmount, 300 days);

        // Should have merged it in a single OGN lockup
        (amount, end, points) = xogn.lockups(ogvWhale, 0);
        assertEq(amount, stakeAmount, "Lockup not migrated");

        (amount, end, points) = veogv.lockups(ogvWhale, 2);
        assertEq(amount, 0, "Amount: Lockup still exists");
        assertEq(end, 0, "End: Lockup still exists");
        assertEq(points, 0, "Points: Lockup still exists");

        // Shouldn't have deleted other migration
        (amount, end, points) = veogv.lockups(ogvWhale, 3);
        assertEq(amount > 0, true, "Other lockup deleted");

        vm.stopPrank();
    }

    function testBurnOnDecomission() public {
        uint256 maxOgnAmount = ogn.balanceOf(address(migrator));

        vm.warp(migrator.endTime() + 100);
        vm.prank(Addresses.TIMELOCK);
        migrator.transferExcessTokens(address(0x22dead));

        assertEq(ogn.balanceOf(address(migrator)), 0 ether, "OGN leftover");
        assertEq(ogn.balanceOf(address(0x22dead)), maxOgnAmount, "OGN not sent to burn address");
    }

    function testMigrateAfterTimelimit() public {
        // Should allow migration even after timelimit
        // but before decommission
        vm.startPrank(ogvWhale);

        vm.warp(migrator.endTime() + 100);

        assertEq(migrator.isMigrationActive(), false, "Migration state not changed");

        migrator.migrate(1 ether);

        // Check migrating stakes as well
        uint256[] memory lockupIds = new uint256[](2);
        lockupIds[0] = 2;
        lockupIds[1] = 3;
        migrator.migrate(lockupIds, 0, 0, false, 0, 0);

        vm.stopPrank();
    }
}
