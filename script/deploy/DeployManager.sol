// SPDX-License-Identifier: Unlicense
pragma solidity 0.8.10;

import "forge-std/Script.sol";
import "OpenZeppelin/openzeppelin-contracts@4.6.0/contracts/utils/Strings.sol";

import {AbstractScript} from "./AbstractScript.sol";

import {XOGNSetupScript} from "./mainnet/010_xOGNSetupScript.sol";
import {OgnOgvMigrationScript} from "./mainnet/011_OgnOgvMigrationScript.sol";
import {MigrationZapperScript} from "./mainnet/012_MigrationZapperScript.sol";
import {UpgradeMigratorScript} from "./mainnet/013_UpgradeMigratorScript.sol";
import {XOGNGovernanceScript} from "./mainnet/014_xOGNGovernanceScript.sol";

import {DeployTimelockScript} from "./base/001_Timelock.sol";

import {SonicDeployTimelockScript} from "./sonic/001_Timelock.sol";

import {VmSafe} from "forge-std/Vm.sol";

contract DeployManager is Script {
    mapping(string => address) public deployedContracts;
    mapping(string => bool) public scriptsExecuted;

    string internal forkFileId = "";

    bool public isForked;

    constructor() {
        isForked = vm.isContext(VmSafe.ForgeContext.ScriptDryRun) || vm.isContext(VmSafe.ForgeContext.TestGroup);
        forkFileId = Strings.toString(block.timestamp);
    }

    function getDeploymentFilePath() public view returns (string memory) {
        return isForked ? getForkDeploymentFilePath() : getMainnetDeploymentFilePath();
    }

    function getMainnetDeploymentFilePath() public view returns (string memory) {
        return string(abi.encodePacked(vm.projectRoot(), "/build/deployments.json"));
    }

    function getForkDeploymentFilePath() public view returns (string memory) {
        return string(abi.encodePacked(vm.projectRoot(), "/build/deployments-fork", forkFileId, ".json"));
    }

    function setForkFileId(string memory _forkFileId) external {
        forkFileId = _forkFileId;
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

        if (isForked) {
            // Duplicate Mainnet File
            vm.writeFile(getForkDeploymentFilePath(), vm.readFile(mainnetFilePath));
        }
    }

    function run() external {
        // TODO: Use vm.readDir to recursively build this?
        if (block.chainid == 1) {
            _runDeployFile(new XOGNSetupScript());
            _runDeployFile(new OgnOgvMigrationScript());
            _runDeployFile(new MigrationZapperScript());
            _runDeployFile(new UpgradeMigratorScript());
            _runDeployFile(new XOGNGovernanceScript());
        } else if (block.chainid == 8453) {
            _runDeployFile(new DeployTimelockScript());
        } else if (block.chainid == 146) {
            _runDeployFile(new SonicDeployTimelockScript());
        }
    }

    function _runDeployFile(AbstractScript deployScript) internal {
        if (deployScript.proposalExecuted()) {
            // No action to do
            return;
        } else if (deployScript.skip()) {
            console.log("Skipping deployment (skip() == true)");
            return;
        }

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

        /**
         * Pre-deployment
         */
        string memory networkDeployments = "";
        string[] memory existingContracts = vm.parseJsonKeys(fileContents, contractsKey);
        for (uint256 i = 0; i < existingContracts.length; ++i) {
            address deployedAddr =
                vm.parseJsonAddress(fileContents, string(abi.encodePacked(contractsKey, ".", existingContracts[i])));

            networkDeployments = vm.serializeAddress(contractsKey, existingContracts[i], deployedAddr);

            deployedContracts[existingContracts[i]] = deployedAddr;

            deployScript.preloadDeployedContract(existingContracts[i], deployedAddr);
        }

        if (scriptsExecuted[deployScript.DEPLOY_NAME()]) {
            console.log("Skipping deployment (already deployed)");

            // Governance handling
            deployScript.handleGovernanceProposal();
        } else {
            // Deployment
            deployScript.setUp();
            deployScript.run();

            /**
             * Post-deployment
             */
            AbstractScript.DeployRecord[] memory records = deployScript.getAllDeployRecords();

            for (uint256 i = 0; i < records.length; ++i) {
                string memory name = records[i].name;
                address addr = records[i].addr;

                console.log(string(abi.encodePacked("> Recorded Deploy of ", name, " at")), addr);
                networkDeployments = vm.serializeAddress(contractsKey, name, addr);
                deployedContracts[name] = addr;
            }

            // Sleep 0.5s so that the previous write is complete
            vm.sleep(500);
            vm.writeJson(networkDeployments, deploymentsFilePath, contractsKey);
            console.log("> Deployment addresses stored.");

            /**
             * Write Execution History
             */
            currentExecutions = vm.serializeUint(executionsKey, deployScript.DEPLOY_NAME(), block.timestamp);

            // Sleep 0.5s so that the previous write is complete
            vm.sleep(500);
            vm.writeJson(currentExecutions, deploymentsFilePath, executionsKey);
            console.log("> Deploy script execution complete.");
        }
    }

    function getDeployment(string calldata contractName) external view returns (address) {
        return deployedContracts[contractName];
    }
}
