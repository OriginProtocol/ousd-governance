// SPDX-License-Identifier: MIT

pragma solidity 0.8.10;

import "./BaseMainnetScript.sol";
import {Vm} from "forge-std/Vm.sol";

import {Addresses} from "contracts/utils/Addresses.sol";

import {FixedRateRewardsSourceProxy} from "contracts/upgrades/FixedRateRewardsSourceProxy.sol";
import {ExponentialStakingProxy} from "contracts/upgrades/ExponentialStakingProxy.sol";
import {MigratorProxy} from "contracts/upgrades/MigratorProxy.sol";

import {ExponentialStaking} from "contracts/ExponentialStaking.sol";
import {FixedRateRewardsSource} from "contracts/FixedRateRewardsSource.sol";
import {OgvStaking} from "contracts/OgvStaking.sol";
import {Migrator} from "contracts/Migrator.sol";
import {Timelock} from "contracts/Timelock.sol";

contract XOGNSetup is BaseMainnetScript {
    FixedRateRewardsSourceProxy ognRewardsSourceProxy;
    OgvStaking veOgvImpl;

    string public constant override DEPLOY_NAME = "010_xOGNSetup";

    constructor() {}

    function _execute() internal override {
        console.log("Deploy:");
        console.log("------------");

        // 1. Deploy proxy contracts
        //    Since these contracts reference each other, we deploy all the proxies first
        //    so that the addresses are available in implimentation constructors.
        FixedRateRewardsSourceProxy ognRewardsSourceProxy = new FixedRateRewardsSourceProxy();
        _recordDeploy("OGN_REWARDS_SOURCE", address(ognRewardsSourceProxy));

        ExponentialStakingProxy xOgnProxy = new ExponentialStakingProxy();
        _recordDeploy("XOGN", address(xOgnProxy));

        //
        // 2. XOGN implimentation and init
        uint256 ognEpoch = 1717041600; // May 30, 2024 GMT
        uint256 ognMinStaking = 30 * 24 * 60 * 60; // 30 days
        ExponentialStaking xognImpl =
            new ExponentialStaking(Addresses.OGN, ognEpoch, ognMinStaking, address(ognRewardsSourceProxy));
        _recordDeploy("XOGN_IMPL", address(xognImpl));

        console.log("- xOgnProxy init");
        xOgnProxy.initialize(address(xognImpl), Addresses.TIMELOCK, "");

        //
        // 2. Rewards implimentation and init
        uint256 rewardsPerSecond = 0; //TODO: Decide on the params
        FixedRateRewardsSource fixedRateRewardsSourceImpl = new FixedRateRewardsSource(Addresses.OGN);
        _recordDeploy("OGN_REWARDS_SOURCE_IMPL", address(fixedRateRewardsSourceImpl));

        console.log("- OGN rewards init");
        bytes memory implInitData = string.concat(
            fixedRateRewardsSourceImpl.initialize.selector,
            abi.encode(Addresses.STRATEGIST, address(xOgnProxy), rewardsPerSecond)
        );
        ognRewardsSourceProxy.initialize(address(fixedRateRewardsSourceImpl), Addresses.TIMELOCK, implInitData);
    }

    function _fork() internal override {}
}
