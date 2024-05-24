// SPDX-License-Identifier: MIT

pragma solidity 0.8.10;

import "forge-std/Script.sol";
import "OpenZeppelin/openzeppelin-contracts@4.6.0/contracts/utils/Strings.sol";

import {Addresses} from "contracts/utils/Addresses.sol";
import {GovProposal, GovProposalHelper} from "contracts/utils/GovProposalHelper.sol";

import "utils/VmHelper.sol";

abstract contract BaseMainnetScript is Script {
    using VmHelper for Vm;
    using GovProposalHelper for GovProposal;

    uint256 public deployBlockNum = type(uint256).max;
    bool isForked = false;

    // DeployerRecord stuff to be extracted as well
    struct DeployRecord {
        string name;
        address addr;
    }

    DeployRecord[] public deploys;

    mapping(string => address) public deployedContracts;

    function _recordDeploy(string memory name, address addr) internal {
        deploys.push(DeployRecord({name: name, addr: addr}));
        console.log(string(abi.encodePacked("> Deployed ", name, " at")), addr);
        deployedContracts[name] = addr;
    }
    // End DeployRecord

    function getAllDeployRecords() external view returns (DeployRecord[] memory) {
        return deploys;
    }

    function preloadDeployedContract(string memory name, address addr) external {
        deployedContracts[name] = addr;
    }

    function setUp() external {}

    function run() external {
        if (block.chainid != 1) {
            revert("Not Mainnet");
        }
        // Will not execute script if after this block number
        if (block.number > deployBlockNum) {
            // console.log("Current block %s, script block %s", block.number, deployBlockNum);
            return;
        }

        isForked = vm.isForkEnv();

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

    function DEPLOY_NAME() external view virtual returns (string memory);

    function skip() external view virtual returns (bool) {
        return false;
    }

    function _execute() internal virtual;

    function _fork() internal virtual;

    function _buildGovernanceProposal() internal virtual {}

    function handleGovernanceProposal() external virtual {
        _buildGovernanceProposal();
        _fork();
    }
}
