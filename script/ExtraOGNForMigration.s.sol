// SPDX-License-Identifier: MIT

pragma solidity 0.8.10;

import "forge-std/Script.sol";
import {Addresses} from "contracts/utils/Addresses.sol";
import {IMintableERC20} from "contracts/interfaces/IMintableERC20.sol";
import {RewardsSource} from "contracts/RewardsSource.sol";

contract ExtraOGNForMigration is Script {
    uint256 constant OGN_EPOCH = 1717041600; // May 30, 2024 GMT

    // Ref: https://snapshot.org/#/origingov.eth/proposal/0x741893a4d9838c0b69fac03650756e21fe00ec35b5309626bb0d6b816f861f9b
    uint256 public constant OGN_MINTED = 409_664_846 ether;

    function run() external {
        vm.warp(OGN_EPOCH);

        IMintableERC20 ogv = IMintableERC20(Addresses.OGV);

        uint256 rewards = RewardsSource(Addresses.OGV_REWARDS_PROXY).previewRewards();

        uint256 ogvSupply = ogv.totalSupply();
        uint256 maxOgnNeeded = ((ogvSupply + rewards) * 0.09137 ether) / 1 ether;

        console.log("OGV Supply", ogvSupply / 1 ether);
        console.log("Pending OGV Rewards", rewards / 1 ether);
        console.log("Max OGN Needed", maxOgnNeeded / 1 ether);
        console.log("OGN from Treasury", (maxOgnNeeded - OGN_MINTED) / 1 ether);
    }
}
