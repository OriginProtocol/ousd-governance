// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import {ERC20} from "OpenZeppelin/openzeppelin-contracts@4.6.0/contracts/token/ERC20/ERC20.sol";

contract MockOGV is ERC20 {
    constructor() ERC20("OGV", "OGV") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }

    function burnFrom(address owner, uint256 amount) external {
        _burn(owner, amount);
    }
}
