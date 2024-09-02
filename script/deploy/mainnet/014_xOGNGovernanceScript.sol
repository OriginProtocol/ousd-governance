// SPDX-License-Identifier: MIT

pragma solidity 0.8.10;

import "../AbstractScript.sol";

import {Addresses} from "contracts/utils/Addresses.sol";

import {Timelock} from "contracts/Timelock.sol";
import {Governance} from "contracts/Governance.sol";

import {GovFive} from "contracts/utils/GovFive.sol";

import {ERC20Votes} from "OpenZeppelin/openzeppelin-contracts@4.6.0/contracts/token/ERC20/extensions/ERC20Votes.sol";
import {TimelockController} from "OpenZeppelin/openzeppelin-contracts@4.6.0/contracts/governance/TimelockController.sol";

contract XOGNGovernanceScript is AbstractScript {
    using GovFive for GovFive.GovFiveProposal;

    GovFive.GovFiveProposal public govProposal;

    string public constant override DEPLOY_NAME = "014_xOGNGovernance";
    uint256 public constant override CHAIN_ID = 1;
    bool public constant override proposalExecuted = false;

    uint256 public constant OGN_EPOCH = 1717041600; // May 30, 2024 GMT

    constructor() {}

    function _execute() internal override {
        console.log("Deploy:");
        console.log("------------");

        address xOgnProxy = deployedContracts["XOGN"];

        Governance governance = new Governance(ERC20Votes(xOgnProxy), TimelockController(payable(Addresses.TIMELOCK)));

        _recordDeploy("XOGN_GOV", address(governance));
    }

    function _buildGovernanceProposal() internal override {
        Timelock timelock = Timelock(payable(Addresses.TIMELOCK));

        address xognGov = deployedContracts["XOGN_GOV"];

        govProposal.setName("Grant access to OGN Governance");

        govProposal.setDescription("Grant access to OGN Governance");

        // Grant access to OGN Governance
        govProposal.action(
            Addresses.TIMELOCK, "grantRole(bytes32,address)", abi.encode(timelock.PROPOSER_ROLE(), xognGov)
        );
        govProposal.action(
            Addresses.TIMELOCK, "grantRole(bytes32,address)", abi.encode(timelock.CANCELLER_ROLE(), xognGov)
        );
        govProposal.action(
            Addresses.TIMELOCK, "grantRole(bytes32,address)", abi.encode(timelock.EXECUTOR_ROLE(), xognGov)
        );
    }

    function _fork() internal override {
        // Simulate execute on fork by impersonating Timelock
        govProposal.execute();
    }
}
