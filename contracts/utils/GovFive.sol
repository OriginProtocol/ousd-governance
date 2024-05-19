// SPDX-License-Identifier: MIT

pragma solidity 0.8.10;

import {Vm} from "forge-std/Vm.sol";
import {Addresses} from "contracts/utils/Addresses.sol";
import "forge-std/console.sol";

import "OpenZeppelin/openzeppelin-contracts@4.6.0/contracts/utils/Strings.sol";

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
