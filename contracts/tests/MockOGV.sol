// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import { ERC20 } from "OpenZeppelin/openzeppelin-contracts@4.6.0/contracts/token/ERC20/ERC20.sol";

contract MockOgv is ERC20 {
    constructor() ERC20("OGV", "OGV") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
