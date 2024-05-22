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

contract OgnOgvMigrationScript is BaseMainnetScript {
    using GovFive for GovFive.GovFiveProposal;

    GovFive.GovFiveProposal govFive;

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

        _buildGnosisTx();
    }

    function _buildGnosisTx() internal {
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

        // Mint token proposal from OGN governance
        IMintableERC20 ogv = IMintableERC20(Addresses.OGV);
        // Mint additional OGN, will get returned after starting migration
        uint256 ognToMint = ((ogv.totalSupply() * 0.09137 ether) / 1 ether) + 1_000_000 ether;

        address[] memory targets = new address[](1);
        string[] memory sigs = new string[](1);
        bytes[] memory calldatas = new bytes[](1);

        // OGN Gov 1: Mint OGN
        targets[0] = Addresses.OGN;
        sigs[0] = "mint(address,uint256)";
        calldatas[0] = abi.encode(deployedContracts["MIGRATOR"], ognToMint);

        govFive.action(
            Addresses.OGN_GOVERNOR,
            "propose(address[],string[],bytes[],string)",
            abi.encode(targets, sigs, calldatas, "")
        );

        if (!isForked) {
            govFive.printTxData();
        }
    }

    function _fork() internal override {
        // Simulate execute on fork
        govFive.execute();

        vm.startPrank(Addresses.GOV_MULTISIG);

        IOGNGovernance ognGovernance = IOGNGovernance(Addresses.OGN_GOVERNOR);
        uint256 proposalId = ognGovernance.proposalCount();

        uint256 state = ognGovernance.state(proposalId);

        if (state == 0) {
            console.log("Queueing OGN multisig proposal...");
            ognGovernance.queue(proposalId);
            state = ognGovernance.state(proposalId);
        }

        if (state == 1) {
            console.log("Executing OGN multisig proposal...");
            vm.warp(block.timestamp + 2 days);
            ognGovernance.execute(proposalId);
        }
        vm.stopPrank();

        IMintableERC20 ogn = IMintableERC20(Addresses.OGN);

        // Start migration
        vm.startPrank(Addresses.TIMELOCK);
        // TODO: To be called by multisig after mint proposal is executed
        Migrator migrator = Migrator(deployedContracts["MIGRATOR"]);
        migrator.start();
        migrator.transferExcessTokens(Addresses.GOV_MULTISIG);
        vm.stopPrank();

        console.log("Migration started");
    }
}
