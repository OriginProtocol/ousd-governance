// SPDX-License-Identifier: MIT

pragma solidity 0.8.10;

import "forge-std/Vm.sol";

library VmHelper {
    function getVM() internal view returns (Vm vm) {
        address VM_ADDRESS = address(uint160(uint256(keccak256("hevm cheat code"))));
        vm = Vm(VM_ADDRESS);
    }

    function isForkEnv(Vm vm) public view returns (bool) {
        return vm.isContext(VmSafe.ForgeContext.ScriptDryRun) || vm.isContext(VmSafe.ForgeContext.Test)
            || vm.isContext(VmSafe.ForgeContext.TestGroup);
    }

    function isTestEnv(Vm vm) public view returns (bool) {
        return vm.isContext(VmSafe.ForgeContext.Test) || vm.isContext(VmSafe.ForgeContext.TestGroup);
    }
}
