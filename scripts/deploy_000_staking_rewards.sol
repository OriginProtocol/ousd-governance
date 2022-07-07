// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;
import "forge-std/Script.sol";

import "../../contracts/upgrades/RewardsSourceProxy.sol";
import "../../contracts/upgrades/OgvStakingProxy.sol";
import "../../contracts/OgvStaking.sol";
import { RewardsSource } from "../../contracts/RewardsSource.sol";
import "../../contracts/GovernanceToken.sol";



contract Deploy000StakingRewards is Script {

    struct Slope {  // from RewardsSource
        uint64 start;
        uint64 end;
        uint128 ratePerDay;
    }

    function run() public {
        uint256 EPOCH = 1657584000;
        uint256 MIN_STAKE_DURATION = 30 days;
        address DEPLOYER = msg.sender;
        address GOV_MULTISIG = 0xbe2AB3d3d8F6a32b96414ebbd865dBD276d3d899;


        address ogvAddress = 0x9c354503C38481a7A7a51629142963F98eCC12D0; // Todo, move to constructor

        console.log("OGV Staking Deploy");
        console.log("Deploying from", msg.sender);

        OriginDollarGovernance ogv = OriginDollarGovernance(ogvAddress);
        console.log("OGV address", address(ogv));
        console.log("OGV totalSupply", ogv.totalSupply());
        

        vm.startBroadcast();


        // Deploy contracts

        RewardsSource source = new RewardsSource(address(ogv));
        console.log("RewardsSource Impl", address(source));
        RewardsSourceProxy rewardsProxy = new RewardsSourceProxy();
        console.log("RewardsSourceProxy", address(rewardsProxy));
        rewardsProxy.initialize(address(source), DEPLOYER, '');
        source = RewardsSource(address(rewardsProxy));

        OgvStaking staking = new OgvStaking(address(ogv), EPOCH, MIN_STAKE_DURATION, address(source));
        console.log("OgvStaking Impl", address(staking));
        OgvStakingProxy stakingProxy = new OgvStakingProxy();
        console.log("OgvStakingProxy", address(stakingProxy));

        stakingProxy.initialize(address(staking), DEPLOYER, '');
        staking = OgvStaking(address(stakingProxy));


        // Configure

        RewardsSource.Slope[] memory slopes = new RewardsSource.Slope[](7);
        slopes[0] = RewardsSource.Slope(1657584000, 0, 3333333 * 1e18);
        slopes[1] = RewardsSource.Slope(1660176000, 0, 2666667 * 1e18);
        slopes[2] = RewardsSource.Slope(1665360000, 0, 1866667 * 1e18);
        slopes[3] = RewardsSource.Slope(1675728000, 0, 1120000 * 1e18);
        slopes[4] = RewardsSource.Slope(1696464000, 0,  560000 * 1e18);
        slopes[5] = RewardsSource.Slope(1727568000, 0,  224000 * 1e18);
        slopes[6] = RewardsSource.Slope(1779408000, 0,   67200 * 1e18);
        source.setInflation(slopes);
        source.setRewardsTarget(address(staking));


        // Ownership

        rewardsProxy.transferGovernance(GOV_MULTISIG);
        stakingProxy.transferGovernance(GOV_MULTISIG);
    }
}