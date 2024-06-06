// SPDX-License-Identifier: MIT

pragma solidity 0.8.10;

import "./BaseMainnetScript.sol";
import {Vm} from "forge-std/Vm.sol";

import {Addresses} from "contracts/utils/Addresses.sol";

import {MigratorProxy} from "contracts/upgrades/MigratorProxy.sol";

import {OgvStaking} from "contracts/OgvStaking.sol";
import {Migrator} from "contracts/Migrator.sol";
import {Timelock} from "contracts/Timelock.sol";
import {IMintableERC20} from "contracts/interfaces/IMintableERC20.sol";

import {GovProposal, GovProposalHelper} from "contracts/utils/GovProposalHelper.sol";

contract OgnOgvMigrationScript is BaseMainnetScript {
    using GovProposalHelper for GovProposal;

    string public constant override DEPLOY_NAME = "011_OgnOgvMigration";
    bool public constant override proposalExecuted = true;

    GovProposal public govProposal;

    uint256 public constant OGN_EPOCH = 1717041600; // May 30, 2024 GMT

    // Ref: https://snapshot.org/#/origingov.eth/proposal/0x741893a4d9838c0b69fac03650756e21fe00ec35b5309626bb0d6b816f861f9b
    uint256 public constant OGN_TO_MINT = 409_664_846 ether;

    // From `script/ExtraOGNForMigration.s.sol`, rounded off
    uint256 public constant EXTRA_OGN_FOR_MIGRATION = 3_010_000 ether;

    uint256 public constant EXTRA_OGN_FOR_REWARDS = 344_736 ether;

    uint256 public constant REWARDS_PER_SECOND = 0.57 ether;

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

    function _buildGovernanceProposal() internal override {
        Timelock timelock = Timelock(payable(Addresses.TIMELOCK));

        address ognRewardsSourceProxy = deployedContracts["OGN_REWARDS_SOURCE"];
        address veOgvImpl = deployedContracts["VEOGV_IMPL"];

        govProposal.setDescription(
            "OGV>OGN Migration Contracts"
            "\n\nThis proposal deploys, funds and enables the Migrator contract which can be used to migrate OGV to OGN and also veOGV to xOGN."
            "\n\nThe proposal mints 409,664,846 OGN (as specificed in the previous off-chain snapshot governance proposal). It also uses some OGN from the treasury multisig to account for the increase in OGV supply due to inflation since the snapshot proposal was posted."
            "\n\nThis proposal also revokes all roles that the OGV Governance has on the Timelock. Buyback contracts are upgraded to buy OGN instead of OGV"
        );

        // Realize any pending rewards
        govProposal.action(Addresses.VEOGV, "collectRewards()", "");
        // Upgrade veOGV implementation
        govProposal.action(Addresses.VEOGV, "upgradeTo(address)", abi.encode(veOgvImpl));

        // Revoke access from OGV governance
        govProposal.action(
            Addresses.TIMELOCK,
            "revokeRole(bytes32,address)",
            abi.encode(timelock.PROPOSER_ROLE(), Addresses.GOVERNOR_FIVE)
        );
        govProposal.action(
            Addresses.TIMELOCK,
            "revokeRole(bytes32,address)",
            abi.encode(timelock.CANCELLER_ROLE(), Addresses.GOVERNOR_FIVE)
        );
        govProposal.action(
            Addresses.TIMELOCK,
            "revokeRole(bytes32,address)",
            abi.encode(timelock.EXECUTOR_ROLE(), Addresses.GOVERNOR_FIVE)
        );

        // Upgrade buyback contracts & configure them
        govProposal.action(Addresses.OUSD_BUYBACK, "upgradeTo(address)", abi.encode(Addresses.OUSD_BUYBACK_IMPL));
        govProposal.action(Addresses.OUSD_BUYBACK, "setRewardsSource(address)", abi.encode(ognRewardsSourceProxy));
        govProposal.action(Addresses.OETH_BUYBACK, "upgradeTo(address)", abi.encode(Addresses.OETH_BUYBACK_IMPL));
        govProposal.action(Addresses.OETH_BUYBACK, "setRewardsSource(address)", abi.encode(ognRewardsSourceProxy));

        // Mint OGN required
        govProposal.action(
            Addresses.OGN, "mint(address,uint256)", abi.encode(deployedContracts["MIGRATOR"], OGN_TO_MINT)
        );

        // Transfer in excess OGN from Multisig (for migration)
        govProposal.action(
            Addresses.OGN,
            "transferFrom(address,address,uint256)",
            abi.encode(Addresses.GOV_MULTISIG, deployedContracts["MIGRATOR"], EXTRA_OGN_FOR_MIGRATION)
        );

        // Transfer in OGN from Multisig (for rewards)
        govProposal.action(
            Addresses.OGN,
            "transferFrom(address,address,uint256)",
            abi.encode(Addresses.GOV_MULTISIG, deployedContracts["OGN_REWARDS_SOURCE"], EXTRA_OGN_FOR_REWARDS)
        );

        // Enable rewards for staking
        govProposal.action(
            deployedContracts["OGN_REWARDS_SOURCE"],
            "setRewardsPerSecond(uint192)",
            abi.encode(uint192(REWARDS_PER_SECOND))
        );

        // Start migration
        govProposal.action(deployedContracts["MIGRATOR"], "start()", "");

        // Ensure solvency and transfer out excess OGN
        govProposal.action(
            deployedContracts["MIGRATOR"], "transferExcessTokens(address)", abi.encode(Addresses.GOV_MULTISIG)
        );
    }

    function _fork() internal override {
        IMintableERC20 ogn = IMintableERC20(Addresses.OGN);

        // Make sure multisig has enough of OGN
        // to fund migration and rewards
        uint256 additionalOGN = EXTRA_OGN_FOR_MIGRATION + EXTRA_OGN_FOR_REWARDS;
        vm.prank(Addresses.TIMELOCK);
        ogn.mint(Addresses.GOV_MULTISIG, additionalOGN);

        // And timelock can move it
        vm.prank(Addresses.GOV_MULTISIG);
        ogn.approve(Addresses.TIMELOCK, additionalOGN);

        // Simulate proposal on OGV Governance
        govProposal.simulate(Addresses.GOVERNOR_FIVE);
    }
}
