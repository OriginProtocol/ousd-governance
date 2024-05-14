// SPDX-License-Identifier: MIT

pragma solidity 0.8.10;

import "forge-std/Script.sol";

import {Addresses} from "contracts/utils/Addresses.sol";

abstract contract BaseMainnetScript is Script {
    uint256 public deployBlockNum = type(uint256).max;
    bool isForked = false;

    function run() external {
        if (block.chainid != 1) {
            revert("Not Mainnet");
        }
        // Will not execute script if after this block number
        if (block.number > deployBlockNum) {
            // console.log("Current block %s, script block %s", block.number, deployBlockNum);
            return;
        }

        isForked = vm.envOr("IS_FORK", false);
        if (isForked) {
            address impersonator = Addresses.INITIAL_DEPLOYER;
            console.log("Running script on mainnet fork impersonating: %s", impersonator);
            vm.startPrank(impersonator);
        } else {
            uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
            address deployer = vm.rememberKey(deployerPrivateKey);
            vm.startBroadcast(deployer);
            console.log("Deploying on mainnet with deployer: %s", deployer);
        }

        _execute();

        if (isForked) {
            vm.stopPrank();
            _fork();
        } else {
            vm.stopBroadcast();
        }
    }

    function _execute() internal virtual {}

    function _fork() internal virtual {}
}
