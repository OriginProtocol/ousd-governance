// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "OpenZeppelin/openzeppelin-contracts@4.6.0/contracts/governance/TimelockController.sol";

contract Timelock is TimelockController {
    constructor(address[] memory proposers, address[] memory executors)
        TimelockController(86400 * 2, proposers, executors)
    {}
}
