// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "OpenZeppelin/openzeppelin-contracts@02fcc75bb7f35376c22def91b0fb9bc7a50b9458/contracts/token/ERC20/ERC20.sol";
import "OpenZeppelin/openzeppelin-contracts@02fcc75bb7f35376c22def91b0fb9bc7a50b9458/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "OpenZeppelin/openzeppelin-contracts@02fcc75bb7f35376c22def91b0fb9bc7a50b9458/contracts/access/Ownable.sol";

contract NonUUPSToken is ERC20, ERC20Burnable, Ownable {
    constructor() ERC20("TestToken", "TST") {}

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}
