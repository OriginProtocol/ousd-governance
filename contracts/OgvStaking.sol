// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;
import {ERC20Votes} from "OpenZeppelin/openzeppelin-contracts@4.6.0/contracts/token/ERC20/extensions/ERC20Votes.sol";
import {ERC20Permit} from "OpenZeppelin/openzeppelin-contracts@4.6.0/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
import {ERC20} from "OpenZeppelin/openzeppelin-contracts@4.6.0/contracts/token/ERC20/ERC20.sol";
import {PRBMathUD60x18} from "paulrberg/prb-math@2.5.0/contracts/PRBMathUD60x18.sol";
import {RewardsSource} from "./RewardsSource.sol";

contract OgvStaking is ERC20Votes {
    // 1. Core Storage
    uint256 public immutable epoch;

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
    RewardsSource public rewardsSource;
    mapping(address => uint256) public rewardDebtPerShare;
    uint256 public accRewardPerShare; // As of the start of the block

    // Events
    event Stake(
        address indexed user,
        uint256 lockupId,
        uint256 amount,
        uint256 end,
        uint256 points
    );
    event Unstake(
        address indexed user,
        uint256 lockupId,
        uint256 amount,
        uint256 end,
        uint256 points
    );
    event Reward(address indexed user, uint256 amount);

    // 1. Core Functions

    constructor(
        address ogv_,
        uint256 epoch_,
        address rewardsSource_
    ) ERC20("", "") ERC20Permit("veOGV") {
        ogv = ERC20(ogv_);
        epoch = epoch_;
        rewardsSource = RewardsSource(rewardsSource_);
    }

    function name() public pure override returns (string memory) {
        return "veOGV";
    }

    function symbol() public pure override returns (string memory) {
        return "veOGV";
    }

    function transfer(address, uint256) public override returns (bool) {
        revert("Staking: Transfers disabled");
    }

    function transferFrom(
        address,
        address,
        uint256
    ) public override returns (bool) {
        revert("Staking: Transfers disabled");
    }

    // 2. Staking and Lockup Functions

    function stake(
        uint256 amount,
        uint256 duration,
        address to
    ) external {
        _stake(amount, duration, to);
    }

    function stake(
        uint256 amount,
        uint256 duration
    ) external {
        _stake(amount, duration, msg.sender);
    }

    function _stake(
        uint256 amount,
        uint256 duration,
        address to
    ) internal {
        require(to != address(0), "Staking: To the zero address");
        require(amount <= type(uint128).max, "Staking: Too much");
        require(amount > 0, "Staking: Not enough");
        // duration checked inside previewPoints
        (uint256 points, uint256 end) = previewPoints(amount, duration);
        require(
            points + totalSupply() <= type(uint192).max,
            "Staking: Max points exceeded"
        );
        _collectRewards(to);
        lockups[to].push(
            Lockup({
                amount: uint128(amount), // max checked in require above
                end: uint128(end),
                points: points
            })
        );
        _mint(to, points);
        ogv.transferFrom(msg.sender, address(this), amount); // Important that it's sender
        emit Stake(to, lockups[to].length - 1, amount, end, points);
    }

    function unstake(uint256 lockupId) external {
        Lockup memory lockup = lockups[msg.sender][lockupId];
        uint256 amount = lockup.amount;
        uint256 end = lockup.end;
        uint256 points = lockup.points;
        require(block.timestamp >= end, "Staking: End of lockup not reached");
        require(end != 0, "Staking: Already unstaked this lockup");
        _collectRewards(msg.sender);
        delete lockups[msg.sender][lockupId]; // Keeps empty in array, so indexes are stable
        _burn(msg.sender, points);
        ogv.transfer(msg.sender, amount);
        emit Unstake(msg.sender, lockupId, amount, end, points);
    }

    function extend(uint256 lockupId, uint256 duration) external {
        // duration checked inside previewPoints
        _collectRewards(msg.sender);
        Lockup memory lockup = lockups[msg.sender][lockupId];
        uint256 oldAmount = lockup.amount;
        uint256 oldEnd = lockup.end;
        uint256 oldPoints = lockup.points;
        (uint256 newPoints, uint256 newEnd) = previewPoints(
            oldAmount,
            duration
        );
        require(newEnd > oldEnd, "New lockup must be longer");
        lockup.end = uint128(newEnd);
        lockup.points = newPoints;
        lockups[msg.sender][lockupId] = lockup;
        _mint(msg.sender, newPoints - oldPoints);
        emit Unstake(msg.sender, lockupId, oldAmount, oldEnd, oldPoints);
        emit Stake(msg.sender, lockupId, oldAmount, newEnd, newPoints);
    }

    function previewPoints(uint256 amount, uint256 duration)
        public
        view
        returns (uint256, uint256)
    {
        require(duration >= 7 days, "Staking: Too short");
        require(duration <= 1461 days, "Staking: Too long");
        uint256 start = block.timestamp > epoch ? block.timestamp : epoch;
        uint256 end = start + duration;
        uint256 endYearpoc = ((end - epoch) * 1e18) / 365 days;
        uint256 multiplier = PRBMathUD60x18.pow(YEAR_BASE, endYearpoc);
        return ((amount * multiplier) / 1e18, end);
    }

    // 3. Reward functions

    function collectRewards() external {
        _collectRewards(msg.sender);
    }

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

    function _collectRewards(address user) internal {
        uint256 supply = totalSupply();
        if (supply == 0) {
            return; // Increasing accRewardPerShare would be meaningless.
        }
        uint256 preBalance = ogv.balanceOf(address(this));
        try rewardsSource.collectRewards() {
        } catch { // Governance staking should continue, even if rewards fail
        }
        uint256 collected = ogv.balanceOf(address(this)) - preBalance;
        accRewardPerShare += (collected * 1e12) / supply;
        uint256 netRewardsPerShare = accRewardPerShare - rewardDebtPerShare[user];
        uint256 netRewards = (balanceOf(user) * netRewardsPerShare) / 1e12;
        rewardDebtPerShare[user] = accRewardPerShare ;
        if (netRewards == 0) {
            return;
        }
        ogv.transfer(user, netRewards);
        emit Reward(user, netRewards);
    }
}
