// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "OpenZeppelin/openzeppelin-contracts@4.6.0/contracts/token/ERC20/IERC20.sol";
import "OpenZeppelin/openzeppelin-contracts@4.6.0/contracts/utils/cryptography/MerkleProof.sol";

interface IOGVStaking {
    function stake(
        uint256 amount,
        uint256 end,
        address _account
    ) external;
}

contract OptionalLockupDistributor {
    //@notice This event is triggered whenever a call to #claim succeeds.
    event Claimed(uint256 index, address account, uint256 amount);

    address public immutable token;
    bytes32 public immutable merkleRoot;
    address public immutable stakingContract;

    // This is a packed array of booleans.
    mapping(uint256 => uint256) private claimedBitMap;

    constructor(
        address _token,
        bytes32 _merkleRoot,
        address _stakingContract
    ) {
        token = _token;
        merkleRoot = _merkleRoot;
        stakingContract = _stakingContract;
    }

    /**
     * @dev
     * @param _index Index in the tree
     */
    function isClaimed(uint256 _index) public view returns (bool) {
        uint256 claimedWordIndex = _index / 256;
        uint256 claimedBitIndex = _index % 256;
        uint256 claimedWord = claimedBitMap[claimedWordIndex];
        uint256 mask = (1 << claimedBitIndex);
        return claimedWord & mask == mask;
    }

    /**
     * @dev
     * @param _index Index in the tree
     */
    function _setClaimed(uint256 _index) private {
        uint256 claimedWordIndex = _index / 256;
        uint256 claimedBitIndex = _index % 256;
        claimedBitMap[claimedWordIndex] =
            claimedBitMap[claimedWordIndex] |
            (1 << claimedBitIndex);
    }

    /**
     * @dev Execute a claim using a merkle proof with optional stake in the staking contract.
     * @param _index Index in the tree
     * @param _amount Amount eligiblle to claim
     * @param _merkleProof The proof
     * @param _stakeDuration Duration of the stake to create
     */
    function claim(
        uint256 _index,
        uint256 _amount,
        bytes32[] calldata _merkleProof,
        uint256 _stakeDuration
    ) external {
        require(!isClaimed(_index), "MerkleDistributor: Drop already claimed.");

        // Verify the merkle proof.
        bytes32 node = keccak256(abi.encodePacked(_index, msg.sender, _amount));
        require(
            MerkleProof.verify(_merkleProof, merkleRoot, node),
            "MerkleDistributor: Invalid proof."
        );

        // Mark it claimed and send the token.
        _setClaimed(_index);
        if (_stakeDuration > 0) {
            IERC20(token).approve(stakingContract, _amount);
            // stakingContract.stake(_amount, _stakeDuration, msg.sender),
            IOGVStaking(stakingContract).stake(
                _amount,
                _stakeDuration,
                msg.sender
            );
        } else {
            require(
                IERC20(token).transfer(msg.sender, _amount),
                "MerkleDistributor: Transfer failed."
            );
        }

        emit Claimed(_index, msg.sender, _amount);
    }
}