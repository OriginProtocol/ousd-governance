// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

contract MockRewardsSource {
    constructor() {}

    function previewRewards() external pure returns (uint256) {
        return 0;
    }

    function collectRewards() external returns (uint256) {
        return 0;
    }
}
