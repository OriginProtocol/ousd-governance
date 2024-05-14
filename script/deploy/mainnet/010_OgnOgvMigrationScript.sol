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


// To be extracted
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

    function action(GovFiveProposal storage prop, address receiver, string memory fullsig, bytes memory data) internal {
        prop.actions.push(GovFiveAction({
            receiver:receiver,
            fullsig: fullsig,
            data: data
            }));
    }

    function execute(GovFiveProposal storage prop) internal {
        address VM_ADDRESS = address(uint160(uint256(keccak256("hevm cheat code"))));
        Vm vm = Vm(VM_ADDRESS);
        for(uint256 i = 0; i < prop.actions.length; i++ ){
            GovFiveAction memory action = prop.actions[i];
            bytes memory sig = abi.encodePacked(bytes4(keccak256(bytes(action.fullsig))));
            vm.prank(Addresses.TIMELOCK);
            action.receiver.call(abi.encodePacked(sig, action.data));
        }
    }


}

contract OgnOgvMigrationScript is BaseMainnetScript {

    // DeployerRecord stuff to be extracted as well
    struct DeployRecord {
        string name;
        address addr;
    }
    DeployRecord[] public deploys;
    function _recordDeploy(string memory name, address addr) internal {
        deploys.push(DeployRecord({name: name, addr: addr}));
        console.log(string(abi.encodePacked("> Deployed ", name, " at")), addr);
    }
    // End DeployRecord


    using GovFive for GovFive.GovFiveProposal;
    GovFive.GovFiveProposal govFive;
    

    FixedRateRewardsSourceProxy ognRewardsSourceProxy;
    OgvStaking veOgvImpl;


    constructor() {
        // Will only execute script before this block number
        // deployBlockNum = ;
    }



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

        MigratorProxy migratorProxy = new MigratorProxy();
        _recordDeploy("MIGRATOR", address(migratorProxy));

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

        //
        // 3. veOGV implimentation contract to upgrade to
        uint256 ogvMinStaking = 30 * 24 * 60 * 60; // 2592000 -> 30 days
        uint256 ogvEpoch = OgvStaking(Addresses.VEOGV).epoch(); // Use old value.
        veOgvImpl = new OgvStaking(Addresses.OGV, ogvEpoch, ogvMinStaking, Addresses.OGV_REWARDS_PROXY, address(migratorProxy));
        _recordDeploy("VEOGV_IMPL", address(veOgvImpl));

        //
        // 4. Migrator Contract
        Migrator migratorImpl = new Migrator(Addresses.OGV, Addresses.OGN, Addresses.VEOGV, address(xOgnProxy));
        _recordDeploy("MIGRATOR_IMPL", address(migratorImpl));

        console.log("- Migrator init");
        migratorProxy.initialize(address(migratorImpl), Addresses.TIMELOCK, "");
    }

    function _fork() internal override {
        Timelock timelock = Timelock(payable(Addresses.TIMELOCK));
        
        govFive.setName("OGV Migration to OGN");
        // Todo: Fuller description
        govFive.setDescription("Deploy OGV-OGN migration contracts and revoke OGV Governance roles");

        console.log(address(veOgvImpl));
        govFive.action(Addresses.VEOGV, 'upgradeTo(address)', abi.encode(address(veOgvImpl)));

        govFive.action(Addresses.TIMELOCK, 'revokeRole(bytes32,address)', abi.encode(timelock.PROPOSER_ROLE(), Addresses.GOVERNOR_FIVE));
        govFive.action(Addresses.TIMELOCK, 'revokeRole(bytes32,address)', abi.encode(timelock.CANCELLER_ROLE(), Addresses.GOVERNOR_FIVE));
        govFive.action(Addresses.TIMELOCK, 'revokeRole(bytes32,address)', abi.encode(timelock.EXECUTOR_ROLE(), Addresses.GOVERNOR_FIVE));

        govFive.action(Addresses.OUSD_BUYBACK, 'upgradeTo(address)', abi.encode(Addresses.OUSD_BUYBACK_IMPL)); // Todo, use latest deployed address
        govFive.action(Addresses.OUSD_BUYBACK, 'setRewardsSource(address)', abi.encode(address(ognRewardsSourceProxy)));
        govFive.action(Addresses.OETH_BUYBACK, 'upgradeTo(address)', abi.encode(Addresses.OETH_BUYBACK_IMPL)); // Todo, use latest deployed address
        govFive.action(Addresses.OETH_BUYBACK, 'setRewardsSource(address)', abi.encode(address(ognRewardsSourceProxy)));


        govFive.execute(); // One day lives up a level, and this contract returns a generic governance struct with a function pointers

    }
}
