// SPDX-License-Identifier: MIT

pragma solidity 0.8.10;

import "./BaseMainnetScript.sol";
import {Vm} from "forge-std/Vm.sol";

import {Addresses} from "contracts/utils/Addresses.sol";

import {FixedRateRewardsSourceProxy} from "contracts/upgrades/FixedRateRewardsSourceProxy.sol";
import {ExponentialStakingProxy} from "contracts/upgrades/ExponentialStakingProxy.sol";
import {MigratorProxy} from "contracts/upgrades/MigratorProxy.sol";

import {ExponentialStaking} from "contracts/ExponentialStaking.sol";
import {FixedRateRewardsSource} from "contracts/FixedRateRewardsSource.sol";
import {OgvStaking} from "contracts/OgvStaking.sol";
import {Migrator} from "contracts/Migrator.sol";
import {Timelock} from "contracts/Timelock.sol";
import {GovFive} from "contracts/utils/GovFive.sol";
import {IMintableERC20} from "contracts/interfaces/IMintableERC20.sol";
import {IOGNGovernance} from "contracts/interfaces/IOGNGovernance.sol";

import {GovProposal, GovProposalHelper} from "contracts/utils/GovProposalHelper.sol";

contract OgnOgvMigrationScript is BaseMainnetScript {
    using GovProposalHelper for GovProposal;

    string public constant override DEPLOY_NAME = "011_OgnOgvMigration";

    constructor() {}

    function _execute() internal override {
        console.log("Deploy:");
        console.log("------------");

        address xOgnProxy = deployedContracts["XOGN"];

        MigratorProxy migratorProxy = new MigratorProxy();
        _recordDeploy("MIGRATOR", address(migratorProxy));

        //
        // 1. veOGV implimentation contract to upgrade to
        uint256 ogvMinStaking = 30 * 24 * 60 * 60; // 2592000 -> 30 days
        uint256 ogvEpoch = OgvStaking(Addresses.VEOGV).epoch(); // Use old value.
        OgvStaking veOgvImpl =
            new OgvStaking(Addresses.OGV, ogvEpoch, ogvMinStaking, Addresses.OGV_REWARDS_PROXY, address(migratorProxy));
        _recordDeploy("VEOGV_IMPL", address(veOgvImpl));

        //
        // 2. Migrator Contract
        Migrator migratorImpl = new Migrator(Addresses.OGV, Addresses.OGN, Addresses.VEOGV, xOgnProxy);
        _recordDeploy("MIGRATOR_IMPL", address(migratorImpl));

        console.log("- Migrator init");
        migratorProxy.initialize(address(migratorImpl), Addresses.TIMELOCK, "");
    }

    function _fork() internal override {}
}
