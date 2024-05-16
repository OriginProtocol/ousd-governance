// SPDX-License-Identifier: Unlicense
pragma solidity 0.8.10;

import "forge-std/Script.sol";
import "OpenZeppelin/openzeppelin-contracts@4.6.0/contracts/utils/Strings.sol";

import {BaseMainnetScript} from "./mainnet/BaseMainnetScript.sol";

import {XOGNSetup} from "./mainnet/010_xOGNSetup.sol";
import {OgnOgvMigrationScript} from "./mainnet/011_OgnOgvMigrationScript.sol";

contract DeployManager is Script {
    mapping(string => address) public deployedContracts;
    mapping(string => bool) public scriptsExecuted;

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
        string memory chainIdStr = Strings.toString(block.chainid);
        string memory chainIdKey = string(abi.encodePacked(".", chainIdStr));

        string memory mainnetFilePath = getMainnetDeploymentFilePath();
        if (!vm.isFile(mainnetFilePath)) {
            // Create mainnet deployment file if it doesn't exist
            vm.writeFile(
                mainnetFilePath,
                string(abi.encodePacked('{ "', chainIdStr, '": { "executions": {}, "contracts": {} } }'))
            );
        } else if (!vm.keyExistsJson(vm.readFile(mainnetFilePath), chainIdKey)) {
            // Create network entry if it doesn't exist
            vm.writeJson(
                vm.serializeJson(chainIdStr, '{ "executions": {}, "contracts": {} }'), mainnetFilePath, chainIdKey
            );
        }

        if (isForked()) {
            // Duplicate Mainnet File
            vm.writeFile(getForkDeploymentFilePath(), vm.readFile(mainnetFilePath));
        }
    }

    function run() external {
        // TODO: Use vm.readDir to recursively build this?
        _runDeployFile(new XOGNSetup());
        _runDeployFile(new OgnOgvMigrationScript());
    }

    function _runDeployFile(BaseMainnetScript deployScript) internal {
        string memory chainIdStr = Strings.toString(block.chainid);
        string memory chainIdKey = string(abi.encodePacked(".", chainIdStr));

        string memory contractsKey = string(abi.encodePacked(chainIdKey, ".contracts"));
        string memory executionsKey = string(abi.encodePacked(chainIdKey, ".executions"));

        string memory deploymentsFilePath = getDeploymentFilePath();
        string memory fileContents = vm.readFile(deploymentsFilePath);

        /**
         * Execution History
         */
        string memory currentExecutions = "";
        string[] memory executionKeys = vm.parseJsonKeys(fileContents, executionsKey);

        for (uint256 i = 0; i < executionKeys.length; ++i) {
            uint256 deployedTimestamp =
                vm.parseJsonUint(fileContents, string(abi.encodePacked(executionsKey, ".", executionKeys[i])));

            currentExecutions = vm.serializeUint(executionsKey, executionKeys[i], deployedTimestamp);
            scriptsExecuted[executionKeys[i]] = true;
        }

        if (scriptsExecuted[deployScript.DEPLOY_NAME()]) {
            // TODO: Handle any active governance proposal
            console.log("Skipping already deployed script");
            return;
        }

        /**
         * Pre-deployment
         */
        BaseMainnetScript.DeployRecord[] memory deploys;
        string memory networkDeployments = "";
        string[] memory existingContracts = vm.parseJsonKeys(fileContents, contractsKey);
        for (uint256 i = 0; i < existingContracts.length; ++i) {
            address deployedAddr =
                vm.parseJsonAddress(fileContents, string(abi.encodePacked(contractsKey, ".", existingContracts[i])));

            networkDeployments = vm.serializeAddress(contractsKey, existingContracts[i], deployedAddr);

            deployedContracts[existingContracts[i]] = deployedAddr;

            deployScript.preloadDeployedContract(existingContracts[i], deployedAddr);
        }

        // Deployment
        deployScript.setUp();
        deployScript.run();

        /**
         * Post-deployment
         */
        BaseMainnetScript.DeployRecord[] memory records = deployScript.getAllDeployRecords();

        for (uint256 i = 0; i < records.length; ++i) {
            string memory name = records[i].name;
            address addr = records[i].addr;

            console.log(string(abi.encodePacked("> Recorded Deploy of ", name, " at")), addr);
            networkDeployments = vm.serializeAddress(contractsKey, name, addr);
            deployedContracts[name] = addr;
        }

        vm.writeJson(networkDeployments, deploymentsFilePath, contractsKey);

        /**
         * Write Execution History
         */
        currentExecutions = vm.serializeUint(executionsKey, deployScript.DEPLOY_NAME(), block.timestamp);

        vm.writeJson(currentExecutions, deploymentsFilePath, executionsKey);
    }

    function getDeployment(string calldata contractName) external view returns (address) {
        return deployedContracts[contractName];
    }
}
