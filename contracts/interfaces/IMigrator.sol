// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

interface IMigrator {
    function migrate(uint256 ogvAmount) external returns (uint256);

    function migrate(
        uint256[] calldata lockupIds,
        uint256 ogvAmountFromWallet,
        uint256 ognAmountFromWallet,
        bool migrateRewards,
        uint256 newStakeAmount,
        uint256 newStakeDuration
    ) external;
}
