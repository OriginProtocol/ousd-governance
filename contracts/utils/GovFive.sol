// SPDX-License-Identifier: MIT

pragma solidity 0.8.10;

import {Vm} from "forge-std/Vm.sol";
import {Addresses} from "contracts/utils/Addresses.sol";
import "forge-std/console.sol";

import {TimelockController} from "OpenZeppelin/openzeppelin-contracts@4.6.0/contracts/governance/TimelockController.sol";

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

    function getSafeTxData(GovFiveProposal memory prop)
        internal
        returns (address receiver, bytes memory payload, bytes32 opHash)
    {
        uint256 actionCount = prop.actions.length;

        address[] memory targets = new address[](actionCount);
        uint256[] memory values = new uint256[](actionCount);
        bytes[] memory payloads = new bytes[](actionCount);

        for (uint256 i = 0; i < prop.actions.length; i++) {
            GovFiveAction memory propAction = prop.actions[i];

            targets[i] = propAction.receiver;
            payloads[i] = abi.encodePacked(bytes4(keccak256(bytes(propAction.fullsig))), propAction.data);
        }

        bytes32 salt = keccak256(bytes(prop.description));

        TimelockController timelock = TimelockController(payable(Addresses.TIMELOCK));
        receiver = Addresses.TIMELOCK;

        opHash = timelock.hashOperationBatch(targets, values, payloads, bytes32(0), salt);

        if (timelock.isOperation(opHash)) {
            bytes4 executeSig = bytes4(keccak256(bytes("executeBatch(address[],uint256[],bytes[],bytes32,bytes32)")));

            console.log("Yet to be exeucted.");
            payload = abi.encodePacked(executeSig, abi.encode(targets, values, payloads, bytes32(0), salt));
        } else {
            bytes4 scheduleSig =
                bytes4(keccak256(bytes("scheduleBatch(address[],uint256[],bytes[],bytes32,bytes32,uint256)")));

            console.log("Yet to be scheduled.");
            payload = abi.encodePacked(scheduleSig, abi.encode(targets, values, payloads, bytes32(0), salt, 2 days));
        }
    }

    function printTxData(GovFiveProposal memory prop) internal {
        uint256 actionCount = prop.actions.length;

        if (actionCount == 0) {
            return;
        }

        (address receiver, bytes memory payload, bytes32 opHash) = getSafeTxData(prop);

        console.log("-----------------------------------");
        console.log("Create following tx on Gnosis safe:");
        console.log("-----------------------------------");
        console.log("Address:", receiver);
        console.log("Data:");
        console.logBytes(payload);
    }

    function executeWithTimelock(GovFiveProposal memory prop) internal {
        address VM_ADDRESS = address(uint160(uint256(keccak256("hevm cheat code"))));
        Vm vm = Vm(VM_ADDRESS);

        uint256 actionCount = prop.actions.length;

        if (actionCount == 0) {
            return;
        }

        vm.startPrank(Addresses.GOV_MULTISIG);
        (address receiver, bytes memory payload, bytes32 opHash) = getSafeTxData(prop);

        TimelockController timelock = TimelockController(payable(Addresses.TIMELOCK));

        if (timelock.isOperationDone(opHash)) {
            return;
        }

        if (!timelock.isOperation(opHash)) {
            console.log("Scheduling...");
            (bool success, bytes memory data) = receiver.call(payload);

            if (!success || !timelock.isOperationDone(opHash)) {
                revert("Failed to schedule");
            }

            (receiver, payload, opHash) = getSafeTxData(prop);
        }

        if (!timelock.isOperationReady(opHash)) {
            vm.roll(1);
            vm.warp(timelock.getTimestamp(opHash) + 10);
        }

        console.log("Executing...");

        (bool success, bytes memory data) = receiver.call(payload);

        if (!success || !timelock.isOperationDone(opHash)) {
            revert("Failed to execute");
        }

        console.log("Executed");

        vm.stopPrank();
    }

    function execute(GovFiveProposal memory prop) internal {
        address VM_ADDRESS = address(uint160(uint256(keccak256("hevm cheat code"))));
        Vm vm = Vm(VM_ADDRESS);
        for (uint256 i = 0; i < prop.actions.length; i++) {
            GovFiveAction memory propAction = prop.actions[i];
            bytes memory sig = abi.encodePacked(bytes4(keccak256(bytes(propAction.fullsig))));
            vm.prank(Addresses.TIMELOCK);
            (bool success, bytes memory data) = propAction.receiver.call(abi.encodePacked(sig, propAction.data));
            if (!success) {
                console.log(propAction.fullsig);
                revert("Multisig action failed");
            }
        }
    }
}
