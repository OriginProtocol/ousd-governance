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
import {Governance} from "contracts/Governance.sol";

import {GovFive} from "contracts/utils/GovFive.sol";

import "OpenZeppelin/openzeppelin-contracts@4.6.0/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "OpenZeppelin/openzeppelin-contracts@4.6.0/contracts/governance/TimelockController.sol";

contract XOGNGovernanceScript is BaseMainnetScript {
    using GovFive for GovFive.GovFiveProposal;

    GovFive.GovFiveProposal govFive;

    string public constant override DEPLOY_NAME = "012_xOGNGovernance";

    uint256 constant OGN_EPOCH = 1717041600; // May 30, 2024 GMT
    uint256 constant REWARDS_PER_SECOND = 300000 ether / uint256(24 * 60 * 60); // 300k per day

    constructor() {}

    function _execute() internal override {
        console.log("Deploy:");
        console.log("------------");

        address xOgnProxy = deployedContracts["XOGN"];

        Governance governance = new Governance(ERC20Votes(xOgnProxy), TimelockController(payable(Addresses.TIMELOCK)));

        _recordDeploy("XOGN_GOV", address(governance));

        _buildGnosisTx();
    }

    function _buildGnosisTx() internal {
        Timelock timelock = Timelock(payable(Addresses.TIMELOCK));

        address xognGov = deployedContracts["XOGN_GOV"];

        govFive.setName("Enable OGN Governance & Begin Rewards");

        govFive.setDescription("Grant roles on Timelock to OGN Governance");

        govFive.action(Addresses.TIMELOCK, "grantRole(bytes32,address)", abi.encode(timelock.PROPOSER_ROLE(), xognGov));
        govFive.action(Addresses.TIMELOCK, "grantRole(bytes32,address)", abi.encode(timelock.CANCELLER_ROLE(), xognGov));
        govFive.action(Addresses.TIMELOCK, "grantRole(bytes32,address)", abi.encode(timelock.EXECUTOR_ROLE(), xognGov));

        // Enable rewards for staking
        govFive.action(
            deployedContracts["OGN_REWARDS_SOURCE"],
            "setRewardsPerSecond(uint192)",
            abi.encode(uint192(REWARDS_PER_SECOND))
        );

        if (!isForked) {
            govFive.printTxData();
        }
    }

    function _fork() internal override {
        // Go to the start of everything
        vm.warp(OGN_EPOCH);

        // Simulate execute on fork
        govFive.execute();
    }
}
