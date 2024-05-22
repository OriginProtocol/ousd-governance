// SPDX-License-Identifier: Unlicense
pragma solidity 0.8.10;

interface IMintableERC20 {
    function mint(address to, uint256 amount) external;
    function balanceOf(address owner) external view returns (uint256);
    function totalSupply() external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 allowance) external;
}
