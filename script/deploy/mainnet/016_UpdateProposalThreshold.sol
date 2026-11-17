// SPDX-License-Identifier: MIT

pragma solidity 0.8.10;

import "../AbstractScript.sol";

import {GovProposal, GovProposalHelper} from "contracts/utils/GovProposalHelper.sol";

contract UpdateProposalThresholdScript is AbstractScript {
    using GovProposalHelper for GovProposal;

    string public constant override DEPLOY_NAME = "016_UpdateProposalThreshold";
    uint256 public constant override CHAIN_ID = 1;
    bool public constant override proposalExecuted = false;

    GovProposal public govProposal;

    uint256 public constant NEW_PROPOSAL_THRESHOLD = 250_000 ether; // 250k xOGN

    constructor() {}

    function _execute() internal override {}

    function _buildGovernanceProposal() internal override {
        govProposal.setDescription(
            "Increase proposal threshold to 250k xOGN"
            "\n\nThis proposal raises the minimum voting power required to submit a governance proposal from 100,000 xOGN to 250,000 xOGN."
        );

        // `setProposalThreshold` is `onlyGovernance`, so the action has to target
        // the Governance contract itself and be executed through a proposal.
        govProposal.action(
            deployedContracts["XOGN_GOV"], "setProposalThreshold(uint256)", abi.encode(NEW_PROPOSAL_THRESHOLD)
        );
    }

    function _fork() internal override {
        // Simulate proposal on xOGN Governance
        govProposal.simulate(deployedContracts["XOGN_GOV"]);
    }
}
