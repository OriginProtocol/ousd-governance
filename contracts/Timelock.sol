// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "OpenZeppelin/openzeppelin-contracts@02fcc75bb7f35376c22def91b0fb9bc7a50b9458/contracts/governance/TimelockController.sol";

contract Timelock is TimelockController {
    constructor(address[] memory proposers, address[] memory executors)
        TimelockController(86400 * 2, proposers, executors)
    {}
}
