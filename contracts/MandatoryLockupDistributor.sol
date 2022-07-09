// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "./AbstractLockupDistributor.sol";

interface IOGVStaking {
    function stake(
        uint256 amount,
        uint256 end,
        address to
    ) external;
}

contract MandatoryLockupDistributor is AbstractLockupDistributor {

    constructor(
        address _token,
        bytes32 _merkleRoot,
        address _stakingContract,
        uint256 _endBlock
    ) AbstractLockupDistributor(_token, _merkleRoot, _stakingContract, _endBlock) {}

    /**
     * @dev Execute a claim using a merkle proof with optional lockup in the staking contract.
     * @param _index Index in the tree
     * @param _amount Amount eligible to claim
     * @param _merkleProof The proof
     */
    function claim(
        uint256 _index,
        uint256 _amount,
        bytes32[] calldata _merkleProof
    ) external {
        require(!isClaimed(_index), "MerkleDistributor: Drop already claimed.");
        require(block.number < endBlock, "Can no longer claim. Claim period expired");

        // Verify the merkle proof.
        bytes32 node = keccak256(abi.encodePacked(_index, msg.sender, _amount));
        require(
            MerkleProof.verify(_merkleProof, merkleRoot, node),
            "MerkleDistributor: Invalid proof."
        );

        // Mark it claimed and send the token.
        setClaimed(_index);

        IERC20(token).approve(stakingContract, _amount);

        // Create four lockups in 12 month increments (1 month = 30 days)
        IOGVStaking(stakingContract).stake(_amount / 4, 360 days, msg.sender); // 30 * 12
        IOGVStaking(stakingContract).stake(_amount / 4, 720 days, msg.sender); // 30 * 24
        IOGVStaking(stakingContract).stake(_amount / 4, 1080 days, msg.sender); // 30 * 36
        IOGVStaking(stakingContract).stake(_amount / 4, 1440 days, msg.sender); // 30 * 48

        emit Claimed(_index, msg.sender, _amount);
    }
}
