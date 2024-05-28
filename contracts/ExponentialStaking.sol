// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import {ERC20Votes} from "OpenZeppelin/openzeppelin-contracts@4.6.0/contracts/token/ERC20/extensions/ERC20Votes.sol";
import {ERC20Permit} from
    "OpenZeppelin/openzeppelin-contracts@4.6.0/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
import {ERC20} from "OpenZeppelin/openzeppelin-contracts@4.6.0/contracts/token/ERC20/ERC20.sol";
import {PRBMathUD60x18} from "paulrberg/prb-math@2.5.0/contracts/PRBMathUD60x18.sol";
import {RewardsSource} from "./RewardsSource.sol";

/// @title ExponentialStaking
/// @author Daniel Von Fange
/// @notice Provides staking, vote power history, vote delegation, and rewards
/// distribution.
///
/// The balance received for staking (and thus the voting power and rewards
/// distribution) goes up exponentially by the end of the staked period.
contract ExponentialStaking is ERC20Votes {
    uint256 public immutable epoch; // Start of staking program - timestamp
    ERC20 public immutable asset; // Must not allow reentrancy
    RewardsSource public immutable rewardsSource;
    uint256 public immutable minStakeDuration; // in seconds
    uint256 public constant maxStakeDuration = 365 days;
    uint256 public constant YEAR_BASE = 14e17;
    int256 public constant NEW_STAKE = -1;

    // 2. Staking and Lockup Storage
    struct Lockup {
        uint128 amount;
        uint128 end;
        uint256 points;
    }

    mapping(address => Lockup[]) public lockups;

    // 3. Reward Storage
    mapping(address => uint256) public rewardDebtPerShare;
    uint256 public accRewardPerShare;

    // Events
    event Stake(address indexed user, uint256 lockupId, uint256 amount, uint256 end, uint256 points);
    event Unstake(address indexed user, uint256 lockupId, uint256 amount, uint256 end, uint256 points);
    event Reward(address indexed user, uint256 amount);
    event Penalty(address indexed user, uint256 amount);

    // Core ERC20 Functions

    constructor(address asset_, uint256 epoch_, uint256 minStakeDuration_, address rewardsSource_)
        ERC20("", "")
        ERC20Permit("xOGN")
    {
        asset = ERC20(asset_);
        epoch = epoch_;
        minStakeDuration = minStakeDuration_;
        rewardsSource = RewardsSource(rewardsSource_);
    }

    function name() public pure override returns (string memory) {
        return "Staked OGN";
    }

    function symbol() public pure override returns (string memory) {
        return "xOGN";
    }

    function transfer(address, uint256) public override returns (bool) {
        revert("Staking: Transfers disabled");
    }

    function transferFrom(address, address, uint256) public override returns (bool) {
        revert("Staking: Transfers disabled");
    }

    // Staking Functions

    /// @notice Stake asset to an address that may not be the same as the
    /// sender of the funds. This can be used to give staked funds to someone
    /// else.
    ///
    /// If staking before the start of staking (epoch), then the lockup start
    /// and end dates are shifted forward so that the lockup starts at the
    /// epoch.
    ///
    /// Any rewards previously earned will be paid out or rolled into the stake.
    ///
    /// @param amountIn asset to lockup in the stake
    /// @param duration in seconds for the stake
    /// @param to address to receive ownership of the stake
    /// @param stakeRewards should pending user rewards be added to the stake
    /// @param lockupId previous stake to extend / add funds to. -1 to create a new stake.
    function stake(uint256 amountIn, uint256 duration, address to, bool stakeRewards, int256 lockupId) external {
        require(to != address(0), "Staking: To the zero address");
        require(duration >= minStakeDuration, "Staking: Too short");
        // Too long checked in preview points

        uint256 newAmount = amountIn;
        uint256 oldPoints = 0;
        uint256 oldEnd = 0;
        Lockup memory lockup;

        // Allow gifts, but not control of other's accounts
        if (to != msg.sender) {
            require(stakeRewards == false, "Staking: Self only");
            require(lockupId == NEW_STAKE, "Staking: Self only");
        }

        // Collect funds from user
        if (amountIn > 0) {
            // Important that `msg.sender` aways pays, not the `to` address.
            asset.transferFrom(msg.sender, address(this), amountIn);
            // amountIn already added into newAmount during initialization
        }

        // Collect funds from old stake (optional)
        if (lockupId != NEW_STAKE) {
            lockup = lockups[to][uint256(lockupId)];
            uint256 oldAmount = lockup.amount;
            oldEnd = lockup.end;
            oldPoints = lockup.points;
            require(oldAmount > 1, "Staking: Already closed stake");
            emit Unstake(to, uint256(lockupId), oldAmount, oldEnd, oldPoints);
            newAmount += oldAmount;
        }

        // Collect funds from rewards (optional)
        newAmount += _collectRewards(to, stakeRewards);

        // Caculate Points and lockup
        require(newAmount > 0, "Staking: Not enough");
        require(newAmount <= type(uint128).max, "Staking: Too much");
        (uint256 newPoints, uint256 newEnd) = previewPoints(newAmount, duration);
        require(newPoints + totalSupply() <= type(uint192).max, "Staking: Max points exceeded");
        lockup.end = uint128(newEnd);
        lockup.amount = uint128(newAmount); // max checked in require above
        lockup.points = newPoints;

        // Update or create lockup
        if (lockupId != NEW_STAKE) {
            require(newEnd >= oldEnd, "Staking: New lockup must not be shorter");
            require(newPoints > oldPoints, "Staking: Must have increased amount or duration");
            lockups[to][uint256(lockupId)] = lockup;
        } else {
            lockups[to].push(lockup);
            uint256 numLockups = lockups[to].length;
            require(numLockups < uint256(type(int256).max), "Staking: Too many lockups");
            lockupId = int256(numLockups - 1);
            // Delegate voting power to the receiver, if unregistered and first stake
            if (numLockups == 1 && delegates(to) == address(0)) {
                _delegate(to, to);
            }
        }
        _mint(to, newPoints - oldPoints);
        emit Stake(to, uint256(lockupId), newAmount, newEnd, newPoints);
    }

    /// @notice Collect staked asset for a lockup and any earned rewards.
    /// @param lockupId the id of the lockup to unstake
    function unstake(uint256 lockupId) external {
        Lockup memory lockup = lockups[msg.sender][lockupId];
        uint256 amount = lockup.amount;
        uint256 end = lockup.end;
        uint256 points = lockup.points;
        require(end != 0, "Staking: Already unstaked this lockup");
        _collectRewards(msg.sender, false);

        uint256 withdrawAmount = previewWithdraw(amount, end);
        uint256 penalty = amount - withdrawAmount;

        delete lockups[msg.sender][lockupId]; // Keeps empty in array, so indexes are stable
        _burn(msg.sender, points);
        if (penalty > 0) {
            asset.transfer(address(rewardsSource), penalty);
            emit Penalty(msg.sender, penalty);
        }
        asset.transfer(msg.sender, withdrawAmount);
        emit Unstake(msg.sender, lockupId, withdrawAmount, end, points);
    }

    // 3. Reward functions

    /// @notice Collect all earned asset rewards.
    function collectRewards() external {
        _collectRewards(msg.sender, false);
    }

    /// @dev Internal function to handle rewards accounting.
    ///
    /// 1. Collect new rewards for everyone
    /// 2. Calculate this user's rewards and accounting
    /// 3. Distribute this user's rewards
    ///
    /// This function *must* be called before any user balance changes.
    ///
    /// This will always update the user's rewardDebtPerShare to match
    /// accRewardPerShare, which is essential to the accounting.
    ///
    /// @param user to collect rewards for
    /// @param shouldRetainRewards if true user's rewards kept in this contract rather than sent
    /// @return retainedRewards amount of rewards not sent to user
    function _collectRewards(address user, bool shouldRetainRewards) internal returns (uint256) {
        uint256 supply = totalSupply();
        if (supply > 0) {
            uint256 preBalance = asset.balanceOf(address(this));
            try rewardsSource.collectRewards() {}
            catch {
                // Governance staking should continue, even if rewards fail
            }
            uint256 collected = asset.balanceOf(address(this)) - preBalance;
            accRewardPerShare += (collected * 1e12) / supply;
        }
        uint256 netRewardsPerShare = accRewardPerShare - rewardDebtPerShare[user];
        uint256 netRewards = (balanceOf(user) * netRewardsPerShare) / 1e12;
        rewardDebtPerShare[user] = accRewardPerShare;
        if (netRewards == 0) {
            return 0;
        }
        emit Reward(user, netRewards);
        if (shouldRetainRewards) {
            return netRewards;
        } else {
            asset.transfer(user, netRewards);
        }
    }

    /// @notice Preview the number of points that would be returned for the
    /// given amount and duration.
    ///
    /// @param amount asset to be staked
    /// @param duration number of seconds to stake for
    /// @return points staking points that would be returned
    /// @return end staking period end date
    function previewPoints(uint256 amount, uint256 duration) public view returns (uint256, uint256) {
        require(duration <= maxStakeDuration, "Staking: Too long");
        uint256 start = block.timestamp > epoch ? block.timestamp : epoch;
        uint256 end = start + duration;
        uint256 endYearpoc = ((end - epoch) * 1e18) / 365 days;
        uint256 multiplier = PRBMathUD60x18.pow(YEAR_BASE, endYearpoc);
        return ((amount * multiplier) / 1e18, end);
    }

    /// @notice Preview the amount of asset a user would receive if they collected
    /// rewards at this time.
    ///
    /// @param user to preview rewards for
    /// @return asset rewards amount
    function previewRewards(address user) external view returns (uint256) {
        uint256 supply = totalSupply();
        if (supply == 0) {
            return 0; // No one has any points to even get rewards
        }
        uint256 _accRewardPerShare = accRewardPerShare;
        _accRewardPerShare += (rewardsSource.previewRewards() * 1e12) / supply;
        uint256 netRewardsPerShare = _accRewardPerShare - rewardDebtPerShare[user];
        return (balanceOf(user) * netRewardsPerShare) / 1e12;
    }

    /// @notice Preview the amount that a user would receive if they withdraw now.
    /// This amount is after any early withdraw fees are removed for early withdraws.
    /// @param amount staked asset amount to be withdrawn
    /// @param end stake end date to be withdrawn from.
    /// @return withdrawAmount amount of assets that the user will receive from withdraw
    function previewWithdraw(uint256 amount, uint256 end) public view returns (uint256) {
        if (block.timestamp >= end) {
            return amount;
        }
        uint256 fullDuration = end - block.timestamp;
        (uint256 fullPoints,) = previewPoints(1e18, fullDuration);
        (uint256 currentPoints,) = previewPoints(1e36, 0); // 1e36 saves a later multiplication
        return amount * ((currentPoints / fullPoints)) / 1e18;
    }

    /// @notice Returns the total number of lockups the user has
    ///         created so far (including expired & unstaked ones)
    /// @param user Address
    /// @return asset Number of lockups the user has had
    function lockupsCount(address user) external view returns (uint256) {
        return lockups[user].length;
    }
}
