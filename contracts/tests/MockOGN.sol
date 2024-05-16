// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import {ERC20} from "OpenZeppelin/openzeppelin-contracts@4.6.0/contracts/token/ERC20/ERC20.sol";

contract MockOGN is ERC20 {
    uint256 nextTransferAmount;

    constructor() ERC20("OGN", "OGN") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function transfer(address to, uint256 amount) public override returns (bool) {
        if (nextTransferAmount > 0) {
            amount = nextTransferAmount;
        }

        _transfer(msg.sender, to, amount);
    }

    function setNetTransferAmount(uint256 amount) external {
        nextTransferAmount = amount;
    }
}
