// SPDX-License-Identifier: MIT

pragma solidity 0.8.10;

import {Addresses} from "contracts/utils/Addresses.sol";
import "forge-std/console.sol";

import "OpenZeppelin/openzeppelin-contracts@4.6.0/contracts/utils/Strings.sol";
// import {IGovernor} from "OpenZeppelin/openzeppelin-contracts@4.6.0/contracts/governance/IGovernor.sol";

import "contracts/utils/VmHelper.sol";

struct GovAction {
    address target;
    uint256 value;
    string fullsig;
    bytes data;
}

struct GovProposal {
    string description;
    GovAction[] actions;
}

library GovProposalHelper {
    using VmHelper for Vm;

    function id(GovProposal memory prop) internal view returns (uint256 proposalId) {
        bytes32 descriptionHash = keccak256(bytes(prop.description));
        (address[] memory targets, uint256[] memory values, bytes[] memory calldatas) = getParams(prop);

        proposalId = uint256(keccak256(abi.encode(targets, values, calldatas, descriptionHash)));
    }

    function getParams(GovProposal memory prop)
        internal
        view
        returns (address[] memory targets, uint256[] memory values, bytes[] memory calldatas)
    {
        uint256 actionLen = prop.actions.length;
        targets = new address[](actionLen);
        values = new uint256[](actionLen);

        string[] memory sigs = new string[](actionLen);
        bytes[] memory data = new bytes[](actionLen);

        for (uint256 i = 0; i < actionLen; ++i) {
            targets[i] = prop.actions[i].target;
            sigs[i] = prop.actions[i].fullsig;
            data[i] = prop.actions[i].data;
            values[i] = prop.actions[i].value;
        }

        calldatas = _encodeCalldata(sigs, data);
    }

    function _encodeCalldata(string[] memory signatures, bytes[] memory calldatas)
        private
        pure
        returns (bytes[] memory)
    {
        bytes[] memory fullcalldatas = new bytes[](calldatas.length);

        for (uint256 i = 0; i < signatures.length; ++i) {
            fullcalldatas[i] = bytes(signatures[i]).length == 0
                ? calldatas[i]
                : abi.encodePacked(bytes4(keccak256(bytes(signatures[i]))), calldatas[i]);
        }

        return fullcalldatas;
    }

    function setDescription(GovProposal storage prop, string memory description) internal {
        prop.description = description;
    }

    function action(GovProposal storage prop, address target, string memory fullsig, bytes memory data) internal {
        prop.actions.push(GovAction({target: target, fullsig: fullsig, data: data, value: 0}));
    }

    function getProposeCalldata(GovProposal memory prop) internal view returns (bytes memory proposeCalldata) {
        (address[] memory targets, uint256[] memory values, bytes[] memory calldatas) = getParams(prop);

        proposeCalldata = abi.encodeWithSignature(
            "propose(address[] memory,uint256[] memory,bytes[] memory,string memory)",
            targets,
            values,
            calldatas,
            prop.description
        );
    }

    function impersonateAndSimulate(GovProposal memory prop) internal {
        address VM_ADDRESS = address(uint160(uint256(keccak256("hevm cheat code"))));
        Vm vm = Vm(VM_ADDRESS);
        console.log("Impersonating timelock to simulate governance proposal...");
        vm.startPrank(Addresses.TIMELOCK);
        for (uint256 i = 0; i < prop.actions.length; i++) {
            GovAction memory propAction = prop.actions[i];
            bytes memory sig = abi.encodePacked(bytes4(keccak256(bytes(propAction.fullsig))));
            (bool success, bytes memory data) = propAction.target.call(abi.encodePacked(sig, propAction.data));
            if (!success) {
                console.log(propAction.fullsig);
                revert("Governance action failed");
            }
        }
        vm.stopPrank();
        console.log("Governance proposal simulation complete");
    }
}
