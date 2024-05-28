// SPDX-License-Identifier: MIT

pragma solidity 0.8.10;

import "forge-std/Test.sol";

import {Addresses} from "contracts/utils/Addresses.sol";
import {DeployManager} from "script/deploy/DeployManager.sol";

import {Migrator} from "contracts/Migrator.sol";
import {MigrationZapper} from "contracts/MigrationZapper.sol";
import {OgvStaking} from "contracts/OgvStaking.sol";
import {ExponentialStaking} from "contracts/ExponentialStaking.sol";

import {IMintableERC20} from "contracts/interfaces/IMintableERC20.sol";

contract ZapperForkTest is Test {
    DeployManager public deployManager;

    Migrator public migrator;
    MigrationZapper public zapper;
    OgvStaking public veogv;
    ExponentialStaking public xogn;
    IMintableERC20 public ogv;
    IMintableERC20 public ogn;

    address public ogvWhale = Addresses.GOV_MULTISIG;

    constructor() {
        deployManager = new DeployManager();

        deployManager.setUp();
        deployManager.run();
    }

    function setUp() external {
        migrator = Migrator(deployManager.getDeployment("MIGRATOR"));
        zapper = MigrationZapper(deployManager.getDeployment("MIGRATION_ZAPPER"));

        veogv = OgvStaking(Addresses.VEOGV);
        ogv = IMintableERC20(Addresses.OGV);
        ogn = IMintableERC20(Addresses.OGN);
        xogn = ExponentialStaking(deployManager.getDeployment("XOGN"));

        vm.startPrank(ogvWhale);
        ogv.approve(address(migrator), type(uint256).max);
        ogv.approve(address(zapper), type(uint256).max);
        ogn.approve(address(migrator), type(uint256).max);
        ogv.approve(address(veogv), type(uint256).max);
        vm.stopPrank();
    }

    function testBalanceMigration() external {
        vm.startPrank(ogvWhale);

        uint256 migratorOGNReserve = ogn.balanceOf(address(migrator));
        uint256 ogvSupply = ogv.totalSupply();
        uint256 ogvBalanceBefore = ogv.balanceOf(ogvWhale);
        uint256 ognBalanceBefore = ogn.balanceOf(ogvWhale);

        // Should be able to swap OGV to OGN at fixed rate
        zapper.migrate(100 ether);

        assertEq(ogv.balanceOf(ogvWhale), ogvBalanceBefore - 100 ether, "More OGV burnt");
        assertEq(ogv.totalSupply(), ogvSupply - 100 ether, "OGV supply mismatch");

        assertEq(ogn.balanceOf(ogvWhale), ognBalanceBefore + 9.137 ether, "Less OGN received");
        assertEq(ogn.balanceOf(address(migrator)), migratorOGNReserve - 9.137 ether, "More OGN sent");

        vm.stopPrank();
    }

    function testMigrateBalanceAndStake() public {
        vm.startPrank(ogvWhale);

        uint256[] memory lockupIds = new uint256[](0);
        uint256 stakeAmount = (100 ether * 0.09137 ether) / 1 ether;

        zapper.migrate(100 ether, stakeAmount, 300 days);

        // Should have it in a single OGN lockup
        (uint128 amount, uint128 end, uint256 points) = xogn.lockups(ogvWhale, 0);
        assertEq(amount, stakeAmount, "Balance not staked");

        vm.stopPrank();
    }

    function testMigrateBalanceAndPartialStake() public {
        vm.startPrank(ogvWhale);

        uint256[] memory lockupIds = new uint256[](0);
        uint256 stakeAmount = (50 ether * 0.09137 ether) / 1 ether;

        uint256 ognBalanceBefore = ogn.balanceOf(ogvWhale);

        zapper.migrate(100 ether, stakeAmount, 300 days);

        // Should have it in a single OGN lockup
        (uint128 amount, uint128 end, uint256 points) = xogn.lockups(ogvWhale, 0);
        assertEq(amount, stakeAmount, "Balance not staked");

        assertEq(ogn.balanceOf(ogvWhale), ognBalanceBefore + stakeAmount, "Less OGN received");

        vm.stopPrank();
    }

    function testTransferTokens() public {
        vm.startPrank(ogvWhale);
        ogn.transfer(address(zapper), 100 ether);
        vm.stopPrank();

        vm.startPrank(Addresses.TIMELOCK);
        zapper.transferTokens(address(ogn), 100 ether);
        vm.stopPrank();

        vm.startPrank(ogvWhale);
        vm.expectRevert(bytes4(keccak256("NotGovernor()")));
        zapper.transferTokens(address(ogn), 100 ether);
        vm.stopPrank();
    }
}
