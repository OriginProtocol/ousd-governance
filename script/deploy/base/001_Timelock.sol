// SPDX-License-Identifier: MIT

pragma solidity 0.8.10;

import "../AbstractScript.sol";
import {Vm} from "forge-std/Vm.sol";

import {AddressesBase} from "contracts/utils/Addresses.sol";

import {Timelock} from "contracts/Timelock.sol";

contract DeployTimelockScript is AbstractScript {
    string public constant override DEPLOY_NAME = "001_Timelock";
    uint256 public constant override CHAIN_ID = 8453;
    bool public constant override proposalExecuted = false;

    constructor() {}

    function _execute() internal override {
        console.log("Deploy:");
        console.log("------------");

        address[] memory proposers = new address[](1);
        address[] memory executors = new address[](1);

        proposers[0] = AddressesBase.GOVERNOR;
        executors[0] = AddressesBase.GOVERNOR;

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
