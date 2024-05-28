// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import {Governable} from "./Governable.sol";
import {Initializable} from "./upgrades/Initializable.sol";
import {IERC20} from "OpenZeppelin/openzeppelin-contracts@4.6.0/contracts/token/ERC20/IERC20.sol";

contract FixedRateRewardsSource is Governable, Initializable {
    error UnauthorizedCaller();

    event StrategistUpdated(address _address);
    event RewardsTargetChange(address target, address previousTarget);
    event RewardsPerSecondChanged(uint256 newRPS, uint256 oldRPS);
    event RewardCollected(uint256 amountCollected);

    address public immutable rewardToken;

    address public strategistAddr;

    address public rewardsTarget;

    struct RewardConfig {
        // Inspired by (Copied from) `Dripper.Drip` struct.
        uint64 lastCollect; // Overflows 262 billion years after the sun dies
        uint192 rewardsPerSecond;
    }

    RewardConfig public rewardConfig;

    /**
     * @dev Verifies that the caller is either Governor or Strategist.
     */
    modifier onlyGovernorOrStrategist() {
        if (msg.sender != strategistAddr && !isGovernor()) {
            revert UnauthorizedCaller();
        }

        _;
    }

    constructor(address _rewardToken) {
        rewardToken = _rewardToken;
    }

    /// @dev Initialize the proxy implementation
    /// @param _strategistAddr Address of the Strategist
    /// @param _rewardsTarget Address that receives rewards
    function initialize(address _strategistAddr, address _rewardsTarget) external initializer {
        _setStrategistAddr(_strategistAddr);
        _setRewardsTarget(_rewardsTarget);

        // Rewards start from the moment the contract is initialized
        rewardConfig.lastCollect = uint64(block.timestamp);
    }

    /// @dev Collect pending rewards
    /// @return rewardAmount Amount of reward collected
    function collectRewards() external returns (uint256 rewardAmount) {
        address _target = rewardsTarget;
        if (_target != msg.sender) {
            revert UnauthorizedCaller();
        }

        // Compute pending rewards
        rewardAmount = previewRewards();

        // Update timestamp
        rewardConfig.lastCollect = uint64(block.timestamp);

        if (rewardAmount > 0) {
            // Should not revert if there's no reward to transfer.

            emit RewardCollected(rewardAmount);

            // Intentionally skipping balance check to save some gas
            // since `transfer` anyway would fail in case of low balance
            IERC20(rewardToken).transfer(_target, rewardAmount);
        }
    }

    /// @dev Compute pending rewards since last collect
    /// @return rewardAmount Amount of reward that'll be distributed if collected now
    function previewRewards() public view returns (uint256 rewardAmount) {
        RewardConfig memory _config = rewardConfig;

        rewardAmount = (block.timestamp - _config.lastCollect) * _config.rewardsPerSecond;
        uint256 balance = IERC20(rewardToken).balanceOf(address(this));
        if (rewardAmount > balance) {
            rewardAmount = balance;
        }
    }

    /// @dev Set address of the strategist
    /// @param _address Address of the Strategist
    function setStrategistAddr(address _address) external onlyGovernor {
        _setStrategistAddr(_address);
    }

    function _setStrategistAddr(address _address) internal {
        emit StrategistUpdated(_address);
        // Can be set to zero to disable
        strategistAddr = _address;
    }

    /// @dev Set the address of the contract than can collect rewards
    /// @param _rewardsTarget contract address that can collect rewards
    function setRewardsTarget(address _rewardsTarget) external onlyGovernor {
        _setRewardsTarget(_rewardsTarget);
    }

    /// @dev Set the address of the contract than can collect rewards
    /// @param _rewardsTarget contract address that can collect rewards
    function _setRewardsTarget(address _rewardsTarget) internal {
        emit RewardsTargetChange(_rewardsTarget, rewardsTarget);
        // Can be set to zero to disable
        rewardsTarget = _rewardsTarget;
    }

    /// @dev Set the rate of reward emission
    /// @param _rewardsPerSecond Amount of rewardToken to distribute per second
    function setRewardsPerSecond(uint192 _rewardsPerSecond) external onlyGovernorOrStrategist {
        _setRewardsPerSecond(_rewardsPerSecond);
    }

    /// @dev Set the rate of reward emission
    /// @param _rewardsPerSecond Amount of rewardToken to distribute per second
    function _setRewardsPerSecond(uint192 _rewardsPerSecond) internal {
        // Update storage
        RewardConfig storage _config = rewardConfig;
        emit RewardsPerSecondChanged(_rewardsPerSecond, _config.rewardsPerSecond);
        if (_config.rewardsPerSecond == 0) {
            /* This contract code allows for contract deployment & initialization and then the contract can be live for quite
             * some time before it is funded and `_rewardsPerSecond` are set to non 0 value. In that case the vesting period 
             * from contract initialization until now would be taken into account instead of the time since the contract has been
             * "activated" by setting the `setRewardsPerSecond`. To mitigate the issue we update the `_config.lastCollect`
             * to current time.
             */
            _config.lastCollect = uint64(block.timestamp);
        }
        _config.rewardsPerSecond = _rewardsPerSecond;
    }
}
