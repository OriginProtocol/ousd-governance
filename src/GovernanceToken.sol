// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title GovernanceToken
 * @dev Basic governance token that can be used in tests of the OUSD governance system.
 */
contract GovernanceToken is ERC20 {
    constructor() ERC20("Governance Token", "GOV") {
        _mint(msg.sender, 2000000000 * 10**decimals());
    }
}
