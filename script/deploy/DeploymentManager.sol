// SPDX-License-Identifier: Unlicense
pragma solidity 0.8.10;

import "forge-std/Script.sol";
import "OpenZeppelin/openzeppelin-contracts@4.6.0/contracts/utils/Strings.sol";

import {OgnOgvMigrationScript} from "./mainnet/010_OgnOgvMigrationScript.sol";

contract DeploymentManager is Script {
    mapping(string => address) public deployments;

    function isForked() public view returns (bool) {
        return vm.isContext(VmSafe.ForgeContext.ScriptDryRun) || vm.isContext(VmSafe.ForgeContext.Test)
            || vm.isContext(VmSafe.ForgeContext.TestGroup);
    }

    function getDeploymentFilePath() public view returns (string memory) {
        return isForked() ? getForkDeploymentFilePath() : getMainnetDeploymentFilePath();
    }

    function getMainnetDeploymentFilePath() public view returns (string memory) {
        return string(abi.encodePacked(vm.projectRoot(), "/build/deployments.json"));
    }

    function getForkDeploymentFilePath() public view returns (string memory) {
        return string(abi.encodePacked(vm.projectRoot(), "/build/deployments-fork.json"));
    }

    function setUp() external {
        string memory mainnetFilePath = getMainnetDeploymentFilePath();
        string memory chainIdStr = Strings.toString(block.chainid);
        string memory chainIdKey = string(abi.encodePacked(".", chainIdStr));

        if (!vm.isFile(mainnetFilePath)) {
            // Create mainnet file if it doesn't exist
            vm.writeFile(mainnetFilePath, string(abi.encodePacked('{ "', chainIdStr, '": {} }')));
        } else if (!vm.keyExistsJson(vm.readFile(mainnetFilePath), chainIdKey)) {
            // Create network entry if it doesn't exist
            vm.writeJson(vm.serializeJson(chainIdStr, "{}"), mainnetFilePath, chainIdKey);
        }

        if (isForked()) {
            // Duplicate Mainnet File
            string memory mainnetDeployments = vm.readFile(mainnetFilePath);
            vm.writeFile(getForkDeploymentFilePath(), mainnetDeployments);
        }
    }

    function run() external {
        _runDeployFile(IDeployScript(address(new OgnOgvMigrationScript())));
    }

    function _runDeployFile(IDeployScript deployScript) internal {
        // Run deployment
        deployScript.setUp();
        deployScript.run();

        // Save artifacts
        string memory deploymentsFilePath = getDeploymentFilePath();
        string memory allDeployments = vm.readFile(deploymentsFilePath);
        string memory chainIdStr = Strings.toString(block.chainid);
        string memory chainIdKey = string(abi.encodePacked(".", chainIdStr));

        IDeployScript.DeployRecord[] memory records = deployScript.getAllDeployRecords();

        string memory networkDeployments = "";

        string[] memory existingContracts = vm.parseJsonKeys(allDeployments, chainIdKey);
        for (uint256 i = 0; i < existingContracts.length; ++i) {
            address deployedAddr =
                vm.parseJsonAddress(allDeployments, string(abi.encodePacked(chainIdKey, ".", existingContracts[i])));

            networkDeployments = vm.serializeAddress(chainIdKey, existingContracts[i], deployedAddr);

            deployments[existingContracts[i]] = deployedAddr;
        }

        for (uint256 i = 0; i < records.length; ++i) {
            string memory name = records[i].name;
            address addr = records[i].addr;

            console.log(string(abi.encodePacked("> Recorded Deploy of ", name, " at")), addr);
            networkDeployments = vm.serializeAddress(chainIdKey, name, addr);
            deployments[name] = addr;
        }

        vm.writeJson(networkDeployments, deploymentsFilePath, chainIdKey);
    }

    function getDeployment(string calldata contractName) external view returns (address) {
        return deployments[contractName];
    }
}

interface IDeployScript {
    // DeployerRecord stuff to be extracted as well
    struct DeployRecord {
        string name;
        address addr;
    }

    function setUp() external;
    function run() external;
    function getAllDeployRecords() external view returns (DeployRecord[] memory);
}
