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

contract XOGNGovernanceForkTest is Test {
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
    }

    function testGovernanceName() external view {
        assertEq(xognGov.name(), "Origin DeFi Governance", "Incorrect symbol");
    }

    function testVotingDelay() external view {
        assertEq(xognGov.votingDelay(), 1, "Incorrect voting delay");
    }

    function testVotingPeriod() external view {
        assertEq(xognGov.votingPeriod(), 14416, "Incorrect voting period");
    }

    function testProposalThreshold() external view {
        assertEq(xognGov.proposalThreshold(), 100000 ether, "Incorrect voting period");
    }

    function testPermissions() external view {
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

    function testCreateProposal() external {
        vm.startPrank(alice);

        xogn.stake(
            100000 ether, // 100k OGN
            30 days,
            alice,
            false,
            NEW_STAKE
        );
        vm.roll(block.number + 1);

        assertEq(xogn.lockupsCount(alice), 1, "Invalid lockup count");

        address[] memory targets = new address[](1);
        targets[0] = address(1234);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = abi.encodePacked(bytes("Hello world"));

        // Test create proposal
        uint256 proposalId = xognGov.propose(targets, values, calldatas, "");

        assertEq(uint256(xognGov.state(proposalId)), uint256(0), "Proposal not created");
        (address[] memory targets2, uint256[] memory values2, string[] memory signatures, bytes[] memory calldatas2) =
            xognGov.getActions(proposalId);

        assertEq(targets2.length, 1, "Invalid targets count");
        assertEq(targets2[0], address(1234), "Invalid targets");

        assertEq(values2.length, 1, "Invalid values count");
        assertEq(values2[0], 0, "Invalid values");

        assertEq(calldatas2.length, 1, "Invalid calldata count");
        assertEq(calldatas2[0], abi.encodePacked(bytes("Hello world")), "Invalid calldata");

        assertEq(signatures.length, 1, "Invalid signatures count");
        assertEq(signatures[0], "", "Invalid signatures");

        vm.stopPrank();
    }

    function testRevertOnProposalThreshold() external {
        vm.startPrank(bob);

        xogn.stake(
            10000 ether, // 10k OGN
            30 days,
            bob,
            false,
            NEW_STAKE
        );
        vm.roll(block.number + 1);

        assertEq(xogn.lockupsCount(bob), 1, "Invalid lockup count");

        address[] memory targets = new address[](1);
        targets[0] = address(1234);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = abi.encodePacked(bytes("Hello world"));

        // Test create proposal
        vm.expectRevert("GovernorCompatibilityBravo: proposer votes below proposal threshold");
        xognGov.propose(targets, values, calldatas, "");

        vm.stopPrank();
    }

    function testFullProposalFlow() external {
        vm.startPrank(xognWhale);
        // xOGN Whale
        ogn.approve(address(xogn), 1e70);
        xogn.stake(
            1000_000_000 ether, // 1B OGN
            365 days,
            xognWhale,
            false,
            NEW_STAKE
        );
        vm.roll(block.number + 1);

        // Test grantRole to address(1010) through governance proposal
        address[] memory targets = new address[](1);
        targets[0] = Addresses.TIMELOCK;
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = abi.encodePacked(
            bytes4(keccak256("grantRole(bytes32,address)")), abi.encode(keccak256("PROPOSER_ROLE"), address(1010))
        );

        // Create proposal
        uint256 proposalId = xognGov.propose(targets, values, calldatas, "");
        assertEq(uint256(xognGov.state(proposalId)), 0, "Proposal wasn't created");

        // Wait for voting to start
        vm.warp(block.timestamp + 10 minutes);
        vm.roll(block.number + 100);
        assertEq(uint256(xognGov.state(proposalId)), 1, "Proposal isn't active");

        // Vote on proposal
        xognGov.castVote(proposalId, 1);

        // Wait for quorum
        vm.warp(block.timestamp + 2 days);
        vm.roll(block.number + 2 days);
        assertEq(uint256(xognGov.state(proposalId)), 4, "Proposal didn't succeed");

        // Queue proposal
        xognGov.queue(proposalId);
        assertEq(uint256(xognGov.state(proposalId)), 5, "Proposal isn't queued");

        // Wait for timelock
        vm.warp(block.timestamp + 2 days);
        vm.roll(block.number + 2 days);

        // Execute proposal
        xognGov.execute(proposalId);
        assertEq(uint256(xognGov.state(proposalId)), 7, "Proposal isn't executed");

        // Check state
        assertEq(timelock.hasRole(keccak256("PROPOSER_ROLE"), address(1010)), true, "Permission not granted");

        vm.stopPrank();
    }

    function testProposalDefeat() external {
        vm.startPrank(xognWhale);
        // xOGN Whale
        ogn.approve(address(xogn), 1e70);
        xogn.stake(
            1000_000_000 ether, // 1B OGN
            365 days,
            xognWhale,
            false,
            NEW_STAKE
        );
        vm.roll(block.number + 1);

        // Test grantRole to address(1010) through governance proposal
        address[] memory targets = new address[](1);
        targets[0] = Addresses.TIMELOCK;
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = abi.encodePacked(
            bytes4(keccak256("grantRole(bytes32,address)")), abi.encode(keccak256("PROPOSER_ROLE"), address(1010))
        );

        // Create proposal
        uint256 proposalId = xognGov.propose(targets, values, calldatas, "");
        assertEq(uint256(xognGov.state(proposalId)), 0, "Proposal wasn't created");

        // Wait for voting to start
        vm.warp(block.timestamp + 10 minutes);
        vm.roll(block.number + 100);
        assertEq(uint256(xognGov.state(proposalId)), 1, "Proposal isn't active");

        // Vote on proposal
        xognGov.castVote(proposalId, 0);

        // Wait for quorum
        vm.warp(block.timestamp + 2 days);
        vm.roll(block.number + 2 days);
        assertEq(uint256(xognGov.state(proposalId)), 3, "Proposal wasn't defeated");

        vm.stopPrank();
    }
}
