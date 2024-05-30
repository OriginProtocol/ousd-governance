// SPDX-License-Identifier: MIT

pragma solidity 0.8.10;

import "./BaseMainnetScript.sol";
import {Vm} from "forge-std/Vm.sol";

import {Addresses} from "contracts/utils/Addresses.sol";

import {Timelock} from "contracts/Timelock.sol";
import {Governance} from "contracts/Governance.sol";

import {GovFive} from "contracts/utils/GovFive.sol";

import {VmHelper} from "utils/VmHelper.sol";

import {Migrator} from "contracts/Migrator.sol";
import {OgvStaking} from "contracts/OgvStaking.sol";

import "OpenZeppelin/openzeppelin-contracts@4.6.0/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "OpenZeppelin/openzeppelin-contracts@4.6.0/contracts/governance/TimelockController.sol";

contract UpgradeMigratorScript is BaseMainnetScript {
    using GovFive for GovFive.GovFiveProposal;
    using VmHelper for Vm;

    GovFive.GovFiveProposal public govProposal;

    string public constant override DEPLOY_NAME = "013_UpgradeMigrator";

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
    }

    function _buildGovernanceProposal() internal override {
        govProposal.action(
            deployedContracts["MIGRATOR"], "upgradeTo(address)", abi.encode(deployedContracts["MIGRATOR_IMPL"])
        );

        govProposal.action(
            deployedContracts["VEOGV"], "upgradeTo(address)", abi.encode(deployedContracts["VEOGV_IMPL"])
        );
    }

    function _fork() internal override {
        // Simulate proposal
        govProposal.printTxData();
        govProposal.executeWithTimelock();
    }
}
