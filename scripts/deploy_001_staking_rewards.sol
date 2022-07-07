// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;
import "forge-std/Script.sol";

import "../contracts/upgrades/RewardsSourceProxy.sol";
import "../contracts/upgrades/OgvStakingProxy.sol";
import "../contracts/OgvStaking.sol";
import {RewardsSource} from "../contracts/RewardsSource.sol";
import "../contracts/GovernanceToken.sol";

contract Deploy000StakingRewards is Script {
    struct Slope {
        // from RewardsSource
        uint64 start;
        uint64 end;
        uint128 ratePerDay;
    }

    function run() public {
        uint256 EPOCH = 1657584000;
        uint256 MIN_STAKE_DURATION = 30 days;
        address DEPLOYER = 0x69e078EBc4631E1947F0c38Ef0357De7ED064644; // msg.sender;
        address ALT_DEPLOYER = 0x71F78361537A6f7B6818e7A760c8bC0146D93f50;
        address GOV_MULTISIG = 0xbe2AB3d3d8F6a32b96414ebbd865dBD276d3d899;

        address ogvAddress = 0x9c354503C38481a7A7a51629142963F98eCC12D0;
        address sourceAdddress = 0x7d82E86CF1496f9485a8ea04012afeb3C7489397;
        address stakingProxy = 0xFdb16A6900Ce90Cb27Afec95dc274D27E0d61b87;

        console.log("OGV Staking Deploy");
        console.log("Deploying from", msg.sender);
        console.log("OgvStaking current proxy", address(stakingProxy));

        OriginDollarGovernance ogv = OriginDollarGovernance(ogvAddress);
        console.log("OGV address", address(ogv));
        console.log("OGV totalSupply", ogv.totalSupply());

        RewardsSource source = RewardsSource(sourceAdddress);
        console.log("Rewards current proxy ", address(source));

        // Deploy
        // ----------
        vm.startBroadcast();
        OgvStaking stakingImpl = new OgvStaking(
            address(ogv),
            EPOCH,
            MIN_STAKE_DURATION,
            sourceAdddress
        );
        console.log("OgvStaking Impl", address(stakingImpl));
        vm.stopBroadcast();

        // Post checks
        // ----------

        // Future governance actions

        vm.prank(DEPLOYER);
        source.setRewardsTarget(stakingProxy);

        console.log("Staking Proxy Owner", OgvStaking(stakingProxy).owner());
        vm.prank(ALT_DEPLOYER);
        OgvStaking(stakingProxy).upgradeTo(address(stakingImpl));
    }
}
