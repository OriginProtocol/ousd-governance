// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import {IStaking} from "./interfaces/IStaking.sol";
import {IMigrator} from "./interfaces/IMigrator.sol";
import {IMintableERC20} from "./interfaces/IMintableERC20.sol";

contract MigrationZapper {
    IMintableERC20 public immutable ogv;
    IMintableERC20 public immutable ogn;

    IMigrator public immutable migrator;
    IStaking public immutable ognStaking;

    address public immutable governor;

    error NotGovernor();

    constructor(address _ogv, address _ogn, address _migrator, address _ognStaking, address _governor) {
        ogv = IMintableERC20(_ogv);
        ogn = IMintableERC20(_ogn);
        migrator = IMigrator(_migrator);
        ognStaking = IStaking(_ognStaking);

        governor = _governor;
    }

    function initialize() external {
        // Migrator can move OGV and OGN from this contract
        ogv.approve(address(migrator), type(uint256).max);
        ogn.approve(address(ognStaking), type(uint256).max);
    }

    /**
     * @notice Migrates the specified amount of OGV to OGN.
     * @param ogvAmount Amount of OGV to migrate
     */
    function migrate(uint256 ogvAmount) external {
        // Take tokens in
        ogv.transferFrom(msg.sender, address(this), ogvAmount);

        // Proxy migrate call
        uint256 ognReceived = migrator.migrate(ogvAmount);

        // Transfer OGN to the receiver
        ogn.transfer(msg.sender, ognReceived);
    }

    /**
     * @notice Migrates the specified amount of OGV to OGN
     *         and stakes it.
     * @param ogvAmount Amount of OGV to migrate
     */
    function migrate(uint256 ogvAmount, uint256 newStakeAmount, uint256 newStakeDuration) external {
        // Take tokens in
        ogv.transferFrom(msg.sender, address(this), ogvAmount);

        // Migrate
        uint256 ognReceived = migrator.migrate(ogvAmount);

        // Stake on behalf of user
        ognStaking.stake(
            newStakeAmount,
            newStakeDuration,
            msg.sender,
            false,
            -1 // New stake
        );

        // Transfer remaining OGN to the receiver
        if (ognReceived > newStakeAmount) {
            ogn.transfer(msg.sender, ognReceived - newStakeAmount);
        }
    }

    /**
     * Transfers any tokens sent by mistake out of the contract
     * @param token Token address
     * @param amount Amount of token to transfer
     */
    function transferTokens(address token, uint256 amount) external {
        if (msg.sender != governor) {
            revert NotGovernor();
        }

        IMintableERC20(token).transfer(governor, amount);
    }
}
