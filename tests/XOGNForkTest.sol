// SPDX-License-Identifier: Unlicense
pragma solidity 0.8.10;

import "forge-std/Test.sol";

import {Addresses} from "contracts/utils/Addresses.sol";
import {DeployManager} from "../script/deploy/DeployManager.sol";

import {ExponentialStaking} from "../contracts/ExponentialStaking.sol";
import {Timelock} from "contracts/Timelock.sol";
import {Governance} from "contracts/Governance.sol";

// import "OpenZeppelin/openzeppelin-contracts@4.6.0/contracts/token/ERC20/IERC20.sol";

interface IMintableERC20 {
    function mint(address to, uint256 amount) external;
    function balanceOf(address owner) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 allowance) external;
}

contract XOGNForkTest is Test {
    DeployManager public deployManager;
    ExponentialStaking public xogn;
    Timelock public timelock;
    Governance public xognGov;

    IMintableERC20 public ogn;
    address public ognRewardsSource;

    address public constant OGN_GOVERNOR = 0x72426BA137DEC62657306b12B1E869d43FeC6eC7;
    address public constant GOV_MULTISIG = 0xbe2AB3d3d8F6a32b96414ebbd865dBD276d3d899;

    address public alice = address(101);
    address public bob = address(102);

    uint256 constant OGN_EPOCH = 1717041600; // May 30, 2024 GMT

    int256 constant NEW_STAKE = -1;

    function setUp() external {
        deployManager = new DeployManager();

        deployManager.setUp();
        deployManager.run();

        xogn = ExponentialStaking(deployManager.getDeployment("XOGN"));
        timelock = Timelock(payable(Addresses.TIMELOCK));
        xognGov = Governance(payable(deployManager.getDeployment("XOGN_GOV")));

        ogn = IMintableERC20(Addresses.OGN);

        ognRewardsSource = deployManager.getDeployment("OGN_REWARDS_SOURCE");
        console.log(ognRewardsSource);

        vm.startPrank(OGN_GOVERNOR);
        ogn.mint(alice, 200000 ether);
        ogn.mint(bob, 200000 ether);
        ogn.mint(ognRewardsSource, 200000 ether);
        vm.stopPrank();

        vm.startPrank(alice);
        ogn.approve(address(xogn), 1e70);
        vm.stopPrank();

        vm.startPrank(bob);
        ogn.approve(address(xogn), 1e70);
        vm.stopPrank();
    }

    function testTokenName() external {
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

        xogn.stake(
            1000 ether, // 1000 OGN
            30 days,
            alice,
            false,
            NEW_STAKE
        );

        assertEq(xogn.lockupsCount(alice), 1, "Invalid lockup count");

        vm.warp(OGN_EPOCH + 31 days);
        xogn.unstake(0);

        assertEq(ogn.balanceOf(alice), 200000 ether, "Incorrect OGN balance");

        (uint128 lockupAmount, uint128 lockupEnd, uint256 lockupPoints) = xogn.lockups(alice, 0);
        assertEq(lockupAmount, 0 ether);
        assertEq(lockupEnd, 0);
        assertEq(lockupPoints, 0);

        assertEq(xogn.accRewardPerShare(), xogn.rewardDebtPerShare(alice));

        vm.stopPrank();
    }

    /**
     * Governance
     */
    function testGovernanceName() external {
        assertEq(xognGov.name(), "Origin DeFi Governance", "Incorrect symbol");
    }

    function testVotingDelay() external {
        assertEq(xognGov.votingDelay(), 1, "Incorrect voting delay");
    }

    function testVotingPeriod() external {
        assertEq(xognGov.votingPeriod(), 14416, "Incorrect voting period");
    }

    function testPermissions() external {
        assertEq(
            timelock.hasRole(keccak256("TIMELOCK_ADMIN_ROLE"), address(xognGov)),
            false,
            "Governance shouldn't have admin role on Timelock"
        );

        assertEq(
            timelock.hasRole(keccak256("PROPOSER_ROLE"), address(xognGov)),
            true,
            "Governance doesn't have proposer role on Timelock"
        );

        assertEq(
            timelock.hasRole(keccak256("EXECUTOR_ROLE"), address(xognGov)),
            true,
            "Governance doesn't have executor role on Timelock"
        );

        assertEq(
            timelock.hasRole(keccak256("CANCELLER_ROLE"), address(xognGov)),
            true,
            "Governance doesn't have cancellor role on Timelock"
        );
    }
}
