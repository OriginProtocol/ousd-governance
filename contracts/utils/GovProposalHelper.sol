// SPDX-License-Identifier: MIT

pragma solidity 0.8.10;

import {Addresses} from "contracts/utils/Addresses.sol";
import "forge-std/console.sol";

import "OpenZeppelin/openzeppelin-contracts@4.6.0/contracts/utils/Strings.sol";
import {IGovernor} from "OpenZeppelin/openzeppelin-contracts@4.6.0/contracts/governance/IGovernor.sol";
import {Governance} from "../Governance.sol";

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
        (address[] memory targets, uint256[] memory values,,, bytes[] memory calldatas) = getParams(prop);

        proposalId = uint256(keccak256(abi.encode(targets, values, calldatas, descriptionHash)));
    }

    function getParams(GovProposal memory prop)
        internal
        view
        returns (
            address[] memory targets,
            uint256[] memory values,
            string[] memory sigs,
            bytes[] memory data,
            bytes[] memory calldatas
        )
    {
        uint256 actionLen = prop.actions.length;
        targets = new address[](actionLen);
        values = new uint256[](actionLen);

        sigs = new string[](actionLen);
        data = new bytes[](actionLen);

        for (uint256 i = 0; i < actionLen; ++i) {
            targets[i] = prop.actions[i].target;
            values[i] = prop.actions[i].value;
            sigs[i] = prop.actions[i].fullsig;
            data[i] = prop.actions[i].data;
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
        (address[] memory targets, uint256[] memory values, string[] memory sigs, bytes[] memory data,) =
            getParams(prop);

        proposeCalldata = abi.encodeWithSignature(
            "propose(address[],uint256[],string[], bytes[],string)", targets, values, sigs, data, prop.description
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

    function simulate(GovProposal memory prop, address governanceAddr) internal {
        address VM_ADDRESS = address(uint160(uint256(keccak256("hevm cheat code"))));
        Vm vm = Vm(VM_ADDRESS);

        uint256 proposalId = id(prop);

        Governance governance = Governance(payable(governanceAddr));

        vm.startPrank(Addresses.GOV_MULTISIG);

        uint256 snapshot = governance.proposalSnapshot(proposalId);

        if (snapshot == 0) {
            bytes memory proposeData = getProposeCalldata(prop);

            console.log("----------------------------------");
            console.log("Create following tx on Governance:");
            console.log("To:", governanceAddr);
            console.log("Data:");
            console.logBytes(proposeData);
            console.log("----------------------------------");

            // Proposal doesn't exists, create it
            console.log("Creating proposal on fork...");
            (bool success, bytes memory data) = governanceAddr.call(proposeData);
        }

        IGovernor.ProposalState state = governance.state(proposalId);

        if (state == IGovernor.ProposalState.Executed) {
            // Skipping executed proposal
            return;
        }

        if (state == IGovernor.ProposalState.Pending) {
            console.log("Waiting for voting period...");
            // Wait for voting to start
            vm.roll(block.number + 10);
            vm.warp(block.timestamp + 10 minutes);

            state = governance.state(proposalId);
        }

        if (state == IGovernor.ProposalState.Active) {
            console.log("Voting on proposal...");
            // Vote on proposal
            try governance.castVote(proposalId, 1) {}
            catch {}
            // Wait for voting to end
            vm.roll(governance.proposalDeadline(proposalId) + 20);
            vm.warp(block.timestamp + 2 days);

            state = governance.state(proposalId);
        }

        if (state == IGovernor.ProposalState.Succeeded) {
            console.log("Queuing proposal...");
            governance.queue(proposalId);

            state = governance.state(proposalId);
        }

        if (state == IGovernor.ProposalState.Queued) {
            console.log("Executing proposal");
            // Wait for timelock
            vm.roll(governance.proposalEta(proposalId) + 20);
            vm.warp(block.timestamp + 2 days);

            governance.execute(proposalId);

            state = governance.state(proposalId);
        }

        if (state != IGovernor.ProposalState.Executed) {
            revert("Unexpected proposal state");
        }

        vm.stopPrank();
    }
}
