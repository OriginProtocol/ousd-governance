// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import {ERC20Votes} from "OpenZeppelin/openzeppelin-contracts@4.6.0/contracts/token/ERC20/extensions/ERC20Votes.sol";
import {ERC20Permit} from
    "OpenZeppelin/openzeppelin-contracts@4.6.0/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
import {ERC20} from "OpenZeppelin/openzeppelin-contracts@4.6.0/contracts/token/ERC20/ERC20.sol";
import {PRBMathUD60x18} from "paulrberg/prb-math@2.5.0/contracts/PRBMathUD60x18.sol";
import {RewardsSource} from "./RewardsSource.sol";

/// @title OGV Staking
/// @author Daniel Von Fange
/// @notice Provides staking, vote power history, vote delegation, and rewards
/// distribution.
///
/// The balance received for staking (and thus the voting power and rewards
/// distribution) goes up exponentially by the end of the staked period.
contract OgvStaking is ERC20Votes {
    // 1. Core Storage
    uint256 public immutable epoch; // timestamp
    uint256 public immutable minStakeDuration; // in seconds

    // 2. Staking and Lockup Storage
    uint256 constant YEAR_BASE = 18e17;

    struct Lockup {
        uint128 amount;
        uint128 end;
        uint256 points;
    }

    mapping(address => Lockup[]) public lockups;

    // 3. Reward Storage
    ERC20 public immutable ogv; // Must not allow reentrancy
    RewardsSource public immutable rewardsSource;
    mapping(address => uint256) public rewardDebtPerShare;
    uint256 public accRewardPerShare; // As of the start of the block

    // Used to track any calls to `delegate()` method. When this isn't
    // set to true, voting powers are delegated to the receiver of the stake
    // when `stake()` or `extend()` method are called.
    // For existing stakers with delegation set, This will remain `false`
    // unless the user calls `delegate()` method.
    mapping(address => bool) public hasDelegationSet;

    // Migrator contract address
    address public immutable migratorAddr;

    // Events
    event Stake(address indexed user, uint256 lockupId, uint256 amount, uint256 end, uint256 points);
    event Unstake(address indexed user, uint256 lockupId, uint256 amount, uint256 end, uint256 points);
    event Reward(address indexed user, uint256 amount);

    // Errors
    error NotMigrator();
    error StakingDisabled();
    error NoLockupsToUnstake();
    error AlreadyUnstaked(uint256 lockupId);

    // 1. Core Functions
    constructor(address ogv_, uint256 epoch_, uint256 minStakeDuration_, address rewardsSource_, address migrator_)
        ERC20("", "")
        ERC20Permit("veOGV")
    {
        ogv = ERC20(ogv_);
        epoch = epoch_;
        minStakeDuration = minStakeDuration_;
        rewardsSource = RewardsSource(rewardsSource_);
        migratorAddr = migrator_;
    }

    function name() public pure override returns (string memory) {
        return "Vote Escrowed Origin DeFi Governance";
    }

    function symbol() public pure override returns (string memory) {
        return "veOGV";
    }

    function transfer(address, uint256) public override returns (bool) {
        revert("Staking: Transfers disabled");
    }

    function transferFrom(address, address, uint256) public override returns (bool) {
        revert("Staking: Transfers disabled");
    }

    modifier onlyMigrator() {
        if (migratorAddr != msg.sender) {
            revert NotMigrator();
        }

        _;
    }

    // 2. Staking and Lockup Functions

    /// @notice Stake OGV to an address that may not be the same as the
    /// sender of the funds. This can be used to give staked funds to someone
    /// else.
    ///
    /// If staking before the start of staking (epoch), then the lockup start
    /// and end dates are shifted forward so that the lockup starts at the
    /// epoch.
    ///
    /// Any rewards previously earned will be paid out.
    ///
    /// @param amount OGV to lockup in the stake
    /// @param duration in seconds for the stake
    /// @param to address to receive ownership of the stake
    function stake(uint256 amount, uint256 duration, address to) external {
        revert StakingDisabled();
    }

    /// @notice Stake OGV
    ///
    /// If staking before the start of staking (epoch), then the lockup start
    /// and end dates are shifted forward so that the lockup starts at the
    /// epoch.
    ///
    /// Any rewards previously earned will be paid out.
    ///
    /// @notice Stake OGV for myself.
    /// @param amount OGV to lockup in the stake
    /// @param duration in seconds for the stake
    function stake(uint256 amount, uint256 duration) external {
        revert StakingDisabled();
    }

    /// @notice Collect staked OGV for a lockup and any earned rewards.
    /// @param lockupId the id of the lockup to unstake
    /// @return unstakedAmount OGV amount unstaked
    /// @return rewardCollected OGV reward amount collected
    function unstake(uint256 lockupId) external returns (uint256 unstakedAmount, uint256 rewardCollected) {
        uint256[] memory lockupIds = new uint256[](1);
        lockupIds[0] = lockupId;
        return _unstake(msg.sender, lockupIds);
    }

    /// @notice Unstake multiple lockups at once.
    /// @param lockupIds Array of the lockup IDs to unstake
    /// @return unstakedAmount OGV amount unstaked
    /// @return rewardCollected OGV reward amount collected
    function unstake(uint256[] memory lockupIds) external returns (uint256 unstakedAmount, uint256 rewardCollected) {
        return _unstake(msg.sender, lockupIds);
    }

    /// @notice Unstakes lockups of an user.
    ///         Can only be called by the Migrator.
    /// @param staker Address of the user
    /// @param lockupIds Array of the lockup IDs to unstake
    /// @return unstakedAmount OGV amount unstaked
    /// @return rewardCollected OGV reward amount collected
    function unstakeFrom(address staker, uint256[] memory lockupIds)
        external
        onlyMigrator
        returns (uint256 unstakedAmount, uint256 rewardCollected)
    {
        return _unstake(staker, lockupIds);
    }

    /// @notice Unstakes lockups of an user.
    /// @param staker Address of the user
    /// @param lockupIds Array of the lockup IDs to unstake
    /// @return unstakedAmount OGV amount unstaked
    /// @return rewardCollected OGV reward amount collected
    function _unstake(address staker, uint256[] memory lockupIds)
        internal
        returns (uint256 unstakedAmount, uint256 rewardCollected)
    {
        if (lockupIds.length == 0) {
            revert NoLockupsToUnstake();
        }

        // Collect rewards
        rewardCollected = _collectRewards(staker);

        uint256 unstakedPoints = 0;

        for (uint256 i = 0; i < lockupIds.length; ++i) {
            uint256 lockupId = lockupIds[i];
            Lockup memory lockup = lockups[staker][lockupId];
            uint256 amount = lockup.amount;
            uint256 end = lockup.end;
            uint256 points = lockup.points;

            unstakedAmount += amount;
            unstakedPoints += points;

            // Make sure it isn't unstaked already
            if (end == 0) {
                revert AlreadyUnstaked(lockupId);
            }

            delete lockups[staker][lockupId]; // Keeps empty in array, so indexes are stable

            emit Unstake(staker, lockupId, amount, end, points);
        }

        // Transfer unstaked OGV
        ogv.transfer(staker, unstakedAmount);
        // ... and burn veOGV
        _burn(staker, unstakedPoints);
    }

    /// @notice Extend a stake lockup for additional points.
    ///
    /// The stake end time is computed from the current time + duration, just
    /// like it is for new stakes. So a new stake for seven days duration and
    /// an old stake extended with a seven days duration would have the same
    /// end.
    ///
    /// If an extend is made before the start of staking, the start time for
    /// the new stake is shifted forwards to the start of staking, which also
    /// shifts forward the end date.
    ///
    /// @param lockupId the id of the old lockup to extend
    /// @param duration number of seconds from now to stake for
    function extend(uint256 lockupId, uint256 duration) external {
        revert StakingDisabled();
    }

    /// @notice Preview the number of points that would be returned for the
    /// given amount and duration.
    ///
    /// @param amount OGV to be staked
    /// @param duration number of seconds to stake for
    /// @return points staking points that would be returned
    /// @return end staking period end date
    function previewPoints(uint256 amount, uint256 duration) public pure returns (uint256, uint256) {
        revert StakingDisabled();
    }

    // 3. Reward functions

    /// @notice Collect all earned OGV rewards.
    /// @return rewardCollected OGV reward amount collected
    function collectRewards() external returns (uint256 rewardCollected) {
        return _collectRewards(msg.sender);
    }

    /// @notice Shows the amount of OGV a user would receive if they collected
    /// rewards at this time.
    ///
    /// @param user to preview rewards for
    /// @return OGV rewards amount
    function previewRewards(address user) external view returns (uint256) {
        if (totalSupply() == 0) {
            return 0; // No one has any points to even get rewards
        }
        uint256 netRewardsPerShare = accRewardPerShare - rewardDebtPerShare[user];
        return (balanceOf(user) * netRewardsPerShare) / 1e12;
    }

    /// @dev Internal function to handle rewards accounting.
    ///
    /// 1. Calculate this user's rewards and accounting
    /// 2. Distribute this user's rewards, if any
    ///
    /// This function *must* be called before any user balance changes.
    ///
    /// This will always update the user's rewardDebtPerShare to match
    /// accRewardPerShare, which is essential to the accounting. This
    /// wouldn't allow user to claim rewards twice
    ///
    /// @param user to collect rewards for
    /// @param netRewards Net reward collected for user
    function _collectRewards(address user) internal returns (uint256 netRewards) {
        if (totalSupply() == 0) {
            return 0; // No one has any points to even get rewards
        }

        uint256 netRewardsPerShare = accRewardPerShare - rewardDebtPerShare[user];
        netRewards = (balanceOf(user) * netRewardsPerShare) / 1e12;

        rewardDebtPerShare[user] = accRewardPerShare;

        if (netRewards == 0) {
            return 0;
        }

        ogv.transfer(user, netRewards);
        emit Reward(user, netRewards);
    }

    /**
     * @dev Change delegation for `delegator` to `delegatee`.
     *
     * Emits events {DelegateChanged} and {DelegateVotesChanged}.
     */
    function _delegate(address delegator, address delegatee) internal override {
        hasDelegationSet[delegator] = true;
        super._delegate(delegator, delegatee);
    }
}
