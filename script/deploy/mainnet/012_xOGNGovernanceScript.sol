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

import "OpenZeppelin/openzeppelin-contracts@4.6.0/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "OpenZeppelin/openzeppelin-contracts@4.6.0/contracts/governance/TimelockController.sol";

// To be extracted
library GovFive {
    struct GovFiveAction {
        address receiver;
        string fullsig;
        bytes data;
    }

    struct GovFiveProposal {
        string name;
        string description;
        GovFiveAction[] actions;
    }

    function setName(GovFiveProposal storage prop, string memory name) internal {
        prop.name = name;
    }

    function setDescription(GovFiveProposal storage prop, string memory description) internal {
        prop.description = description;
    }

    function action(GovFiveProposal storage prop, address receiver, string memory fullsig, bytes memory data)
        internal
    {
        prop.actions.push(GovFiveAction({receiver: receiver, fullsig: fullsig, data: data}));
    }

    function execute(GovFiveProposal storage prop) internal {
        address VM_ADDRESS = address(uint160(uint256(keccak256("hevm cheat code"))));
        Vm vm = Vm(VM_ADDRESS);
        for (uint256 i = 0; i < prop.actions.length; i++) {
            GovFiveAction memory action = prop.actions[i];
            bytes memory sig = abi.encodePacked(bytes4(keccak256(bytes(action.fullsig))));
            vm.prank(Addresses.TIMELOCK);
            action.receiver.call(abi.encodePacked(sig, action.data));
        }
    }
}

contract XOGNGovernanceScript is BaseMainnetScript {
    using GovFive for GovFive.GovFiveProposal;

    GovFive.GovFiveProposal govFive;

    string public constant override DEPLOY_NAME = "012_xOGNGovernance";

    constructor() {}

    function _execute() internal override {
        console.log("Deploy:");
        console.log("------------");

        address xOgnProxy = deployedContracts["XOGN"];

        Governance governance = new Governance(ERC20Votes(xOgnProxy), TimelockController(payable(Addresses.TIMELOCK)));

        _recordDeploy("XOGN_GOV", address(governance));
    }

    function _fork() internal override {
        Timelock timelock = Timelock(payable(Addresses.TIMELOCK));

        address xognGov = deployedContracts["XOGN_GOV"];

        govFive.setName("Enable OGN Governance");
        // Todo: Fuller description
        govFive.setDescription("Grant roles on Timelock to OGN Governance");

        govFive.action(Addresses.TIMELOCK, "grantRole(bytes32,address)", abi.encode(timelock.PROPOSER_ROLE(), xognGov));
        govFive.action(Addresses.TIMELOCK, "grantRole(bytes32,address)", abi.encode(timelock.CANCELLER_ROLE(), xognGov));
        govFive.action(Addresses.TIMELOCK, "grantRole(bytes32,address)", abi.encode(timelock.EXECUTOR_ROLE(), xognGov));

        govFive.execute(); // One day lives up a level, and this contract returns a generic governance struct with a function pointers
    }
}
