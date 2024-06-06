// SPDX-License-Identifier: MIT

pragma solidity 0.8.10;

import "./BaseMainnetScript.sol";
import {Vm} from "forge-std/Vm.sol";

import {Addresses} from "contracts/utils/Addresses.sol";

import {Timelock} from "contracts/Timelock.sol";
import {Governance} from "contracts/Governance.sol";

import {GovFive} from "contracts/utils/GovFive.sol";

import {MigrationZapper} from "contracts/MigrationZapper.sol";

import "OpenZeppelin/openzeppelin-contracts@4.6.0/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "OpenZeppelin/openzeppelin-contracts@4.6.0/contracts/governance/TimelockController.sol";

contract MigrationZapperScript is BaseMainnetScript {
    using GovFive for GovFive.GovFiveProposal;

    GovFive.GovFiveProposal public govProposal;

    string public constant override DEPLOY_NAME = "012_MigrationZapper";
    bool public constant override proposalExecuted = true;

    constructor() {}

    function _execute() internal override {
        console.log("Deploy:");
        console.log("------------");

        MigrationZapper zapper = new MigrationZapper(
            Addresses.OGV, Addresses.OGN, deployedContracts["MIGRATOR"], deployedContracts["XOGN"], Addresses.TIMELOCK
        );
        _recordDeploy("MIGRATION_ZAPPER", address(zapper));

        // Make sure Migrator can move OGV and OGN
        zapper.initialize();
    }

    function _buildGovernanceProposal() internal override {}

    function _fork() internal override {}
}
