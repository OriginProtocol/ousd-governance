// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

interface IStaking {
    function delegates(address staker) external view returns (address);

    // From OGVStaking.sol
    function unstakeFrom(address staker, uint256[] memory lockupIds) external returns (uint256, uint256);

    // From OGVStaking.sol
    function collectRewardsFrom(address staker) external returns (uint256);

    // From ExponentialStaking.sol
    function stake(uint256 amountIn, uint256 duration, address to, bool stakeRewards, int256 lockupId) external;
}
