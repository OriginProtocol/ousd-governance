// SPDX-License-Identifier: MIT

pragma solidity 0.8.10;

import "../AbstractScript.sol";

import {Addresses} from "contracts/utils/Addresses.sol";

import {Timelock} from "contracts/Timelock.sol";
import {Governance} from "contracts/Governance.sol";

import {GovFive} from "contracts/utils/GovFive.sol";

contract RevokeMultisigGovernanceScript is AbstractScript {
    using GovFive for GovFive.GovFiveProposal;

    GovFive.GovFiveProposal public govProposal;

    string public constant override DEPLOY_NAME = "015_RevokeMultisigGovernance";
    uint256 public constant override CHAIN_ID = 1;
    bool public constant override proposalExecuted = false;

    constructor() {}

    function _execute() internal override {}

    function _buildGovernanceProposal() internal override {
        Timelock timelock = Timelock(payable(Addresses.TIMELOCK));

        address xognGov = deployedContracts["XOGN_GOV"];

        govProposal.setName("Revoke access from Multisig");

        govProposal.setDescription("Revoke access from Multisig");

        // Revoke access from Multisig
        govProposal.action(
            Addresses.TIMELOCK,
            "revokeRole(bytes32,address)",
            abi.encode(timelock.PROPOSER_ROLE(), Addresses.GOV_MULTISIG)
        );
        govProposal.action(
            Addresses.TIMELOCK,
            "revokeRole(bytes32,address)",
            abi.encode(timelock.CANCELLER_ROLE(), Addresses.GOV_MULTISIG)
        );
        govProposal.action(
            Addresses.TIMELOCK,
            "revokeRole(bytes32,address)",
            abi.encode(timelock.EXECUTOR_ROLE(), Addresses.GOV_MULTISIG)
        );
    }

    function _fork() internal override {
        // Simulate execute on fork by impersonating Timelock
        govProposal.execute();
    }

    function skip() external view override returns (bool) {
        // Don't deploy it for now
        return true;
    }
}
