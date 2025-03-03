// SPDX-License-Identifier: MIT

pragma solidity 0.8.10;

import "../AbstractScript.sol";

import {Addresses} from "contracts/utils/Addresses.sol";

import {GovFive} from "contracts/utils/GovFive.sol";

import {Migrator} from "contracts/Migrator.sol";
import {OgvStaking} from "contracts/OgvStaking.sol";

contract UpgradeMigratorScript is AbstractScript {
    using GovFive for GovFive.GovFiveProposal;

    GovFive.GovFiveProposal public govProposal;

    string public constant override DEPLOY_NAME = "013_UpgradeMigrator";
    uint256 public constant override CHAIN_ID = 1;
    bool public constant override proposalExecuted = true;

    constructor() {}

    function _execute() internal override {
        console.log("Deploy:");
        console.log("------------");

        // Deploy veOGV implementation
        uint256 ogvMinStaking = 30 * 24 * 60 * 60; // 2592000 -> 30 days
        uint256 ogvEpoch = OgvStaking(Addresses.VEOGV).epoch(); // Use old value.
        OgvStaking veOgvImpl = new OgvStaking(
            Addresses.OGV, ogvEpoch, ogvMinStaking, Addresses.OGV_REWARDS_PROXY, deployedContracts["MIGRATOR"]
        );
        _recordDeploy("VEOGV_IMPL", address(veOgvImpl));

        // Deploy migrator implementation
        Migrator migratorImpl = new Migrator(Addresses.OGV, Addresses.OGN, Addresses.VEOGV, deployedContracts["XOGN"]);
        _recordDeploy("MIGRATOR_IMPL", address(migratorImpl));

        // Transfer Governance
        migratorImpl.transferGovernance(Addresses.TIMELOCK);
    }

    function _buildGovernanceProposal() internal override {
        govProposal.action(
            deployedContracts["MIGRATOR"], "upgradeTo(address)", abi.encode(deployedContracts["MIGRATOR_IMPL"])
        );

        govProposal.action(Addresses.VEOGV, "upgradeTo(address)", abi.encode(deployedContracts["VEOGV_IMPL"]));

        govProposal.action(deployedContracts["MIGRATOR_IMPL"], "claimGovernance()", "");
    }

    function _fork() internal override {
        // Simulate proposal
        govProposal.printTxData();
        govProposal.executeWithTimelock();
    }
}
