// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "OpenZeppelin/openzeppelin-contracts@4.5.0/contracts/token/ERC20/ERC20.sol";

/**
 * @title GovernanceToken
 * @dev Basic governance token that can be used in tests of the OUSD governance system.
 */
contract OGV is ERC20 {
    constructor() ERC20("Origin Governance Token", "OGV") {
        _mint(msg.sender, 1000000000 * 10**decimals());
    }
}
