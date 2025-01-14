// SPDX-License-Identifier: MIT

pragma solidity 0.8.10;

import "../AbstractScript.sol";
import {Vm} from "forge-std/Vm.sol";

import {AddressesSonic} from "contracts/utils/Addresses.sol";

import {Timelock} from "contracts/Timelock.sol";

contract SonicDeployTimelockScript is AbstractScript {
    string public constant override DEPLOY_NAME = "001_Timelock";
    uint256 public constant override CHAIN_ID = 146;
    bool public constant override proposalExecuted = false;

    constructor() {}

    function _execute() internal override {
        console.log("Deploy:");
        console.log("------------");

        address[] memory proposers = new address[](1);
        address[] memory executors = new address[](1);

        proposers[0] = AddressesSonic.ADMIN;
        executors[0] = AddressesSonic.ADMIN;

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
