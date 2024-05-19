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

contract OgnOgvMigrationScript is BaseMainnetScript {
    using GovFive for GovFive.GovFiveProposal;

    GovFive.GovFiveProposal govFive;

    string public constant override DEPLOY_NAME = "011_OgnOgvMigrationScript";

    constructor() {}

    function _execute() internal override {
        console.log("Deploy:");
        console.log("------------");

        address xOgnProxy = deployedContracts["XOGN"];

        MigratorProxy migratorProxy = new MigratorProxy();
        _recordDeploy("MIGRATOR", address(migratorProxy));

        //
        // 3. veOGV implimentation contract to upgrade to
        uint256 ogvMinStaking = 30 * 24 * 60 * 60; // 2592000 -> 30 days
        uint256 ogvEpoch = OgvStaking(Addresses.VEOGV).epoch(); // Use old value.
        OgvStaking veOgvImpl =
            new OgvStaking(Addresses.OGV, ogvEpoch, ogvMinStaking, Addresses.OGV_REWARDS_PROXY, address(migratorProxy));
        _recordDeploy("VEOGV_IMPL", address(veOgvImpl));

        //
        // 4. Migrator Contract
        Migrator migratorImpl = new Migrator(Addresses.OGV, Addresses.OGN, Addresses.VEOGV, xOgnProxy);
        _recordDeploy("MIGRATOR_IMPL", address(migratorImpl));

        console.log("- Migrator init");
        migratorProxy.initialize(address(migratorImpl), Addresses.TIMELOCK, "");
    }

    function _fork() internal override {
        Timelock timelock = Timelock(payable(Addresses.TIMELOCK));

        address ognRewardsSourceProxy = deployedContracts["OGN_REWARDS_SOURCE"];
        address veOgvImpl = deployedContracts["VEOGV_IMPL"];

        govFive.setName("OGV Migration to OGN");
        // Todo: Fuller description
        govFive.setDescription("Deploy OGV-OGN migration contracts and revoke OGV Governance roles");

        console.log(address(veOgvImpl));
        govFive.action(Addresses.VEOGV, "upgradeTo(address)", abi.encode(veOgvImpl));

        govFive.action(
            Addresses.TIMELOCK,
            "revokeRole(bytes32,address)",
            abi.encode(timelock.PROPOSER_ROLE(), Addresses.GOVERNOR_FIVE)
        );
        govFive.action(
            Addresses.TIMELOCK,
            "revokeRole(bytes32,address)",
            abi.encode(timelock.CANCELLER_ROLE(), Addresses.GOVERNOR_FIVE)
        );
        govFive.action(
            Addresses.TIMELOCK,
            "revokeRole(bytes32,address)",
            abi.encode(timelock.EXECUTOR_ROLE(), Addresses.GOVERNOR_FIVE)
        );

        govFive.action(Addresses.OUSD_BUYBACK, "upgradeTo(address)", abi.encode(Addresses.OUSD_BUYBACK_IMPL)); // Todo, use latest deployed address
        govFive.action(Addresses.OUSD_BUYBACK, "setRewardsSource(address)", abi.encode(ognRewardsSourceProxy));
        govFive.action(Addresses.OETH_BUYBACK, "upgradeTo(address)", abi.encode(Addresses.OETH_BUYBACK_IMPL)); // Todo, use latest deployed address
        govFive.action(Addresses.OETH_BUYBACK, "setRewardsSource(address)", abi.encode(ognRewardsSourceProxy));

        govFive.execute(); // One day lives up a level, and this contract returns a generic governance struct with a function pointers
    }
}
