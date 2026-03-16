// SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.8.10;

import "../AbstractScript.sol";
import {Vm} from "forge-std/Vm.sol";

import {AddressesHyperEVM} from "contracts/utils/Addresses.sol";

import {Timelock} from "contracts/Timelock.sol";

contract DeployHyperEVMTimelockScript is AbstractScript {
    string public constant override DEPLOY_NAME = "001_Timelock";
    uint256 public constant override CHAIN_ID = 999;
    bool public constant override proposalExecuted = false;

    constructor() {}

    function _execute() internal override {
        console.log("Deploy:");
        console.log("------------");

        address[] memory proposers = new address[](2);
        address[] memory executors = new address[](2);

        proposers[0] = AddressesHyperEVM.ADMIN;
        executors[0] = AddressesHyperEVM.ADMIN;

        // Giving myself permissions temporarily
        proposers[1] = 0x58890A9cB27586E83Cb51d2d26bbE18a1a647245;
        executors[1] = 0x58890A9cB27586E83Cb51d2d26bbE18a1a647245;

        // 1. Deploy Timelock
        Timelock timelock = new Timelock(
            60, // 60s
            proposers,
            executors
        );
        _recordDeploy("TIMELOCK", address(timelock));
    }

    function _fork() internal override {}
}
