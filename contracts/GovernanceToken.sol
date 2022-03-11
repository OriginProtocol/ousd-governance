// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "OpenZeppelin/openzeppelin-contracts@4.5.0/contracts/token/ERC20/ERC20.sol";
import "OpenZeppelin/openzeppelin-contracts@4.5.0/contracts/access/Ownable.sol";

/**
 * @title GovernanceToken
 * @dev Basic governance token that can be used in tests of the OUSD governance system.
 */
contract GovernanceToken is ERC20, Ownable {
    constructor() ERC20("OUSD Governance", "OGV") {
        _mint(msg.sender, 1000000000 * 10**decimals());
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}
