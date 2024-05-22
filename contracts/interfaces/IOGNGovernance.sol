// SPDX-License-Identifier: Unlicense
pragma solidity 0.8.10;

interface IOGNGovernance {
    function state(uint256 proposalId) external view returns (uint256);
    function proposalCount() external view returns (uint256);
    function queue(uint256 proposalId) external;
    function execute(uint256 proposalId) external;
    function propose(
        address[] memory targets,
        string[] memory signatures,
        bytes[] memory calldatas,
        string memory description
    ) external returns (uint256);
}
