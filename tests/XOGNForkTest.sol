// SPDX-License-Identifier: Unlicense
pragma solidity 0.8.10;

import "forge-std/Test.sol";
import {DeploymentManager} from "../script/deploy/DeploymentManager.sol";
import {ExponentialStaking} from "../contracts/ExponentialStaking.sol";

contract XOGNForkTest is Test {
    DeploymentManager public deploymentManager;
    ExponentialStaking public xogn;

    function setUp() public {
        deploymentManager = new DeploymentManager();

        deploymentManager.setUp();
        deploymentManager.run();

        xogn = ExponentialStaking(deploymentManager.getDeployment("XOGN"));
    }

    function testStakingName() public {
        assertEq(xogn.symbol(), "xOGN", "Incorrect symbol");
    }
}
