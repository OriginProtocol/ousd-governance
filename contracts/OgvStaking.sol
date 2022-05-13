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
    ERC20 public immutable ogv;
    RewardsSource public rewardsSource;
    mapping(address => uint256) public rewardDebt;
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

    constructor(address ogv_, uint256 epoch_, address rewardsSource_)
        ERC20("", "")
        ERC20Permit("OGV Staking")
    {
        ogv = ERC20(ogv_);
        epoch = epoch_;
        rewardsSource = RewardsSource(rewardsSource_);
    }

    function name() public pure override returns (string memory) {
        return "OGVe";
    }

    function symbol() public pure override returns (string memory) {
        return "Staked OGV";
    }

    function transfer(address, uint256)
        public
        override
        returns (bool)
    {
        revert("Staking: Transfers disabled");
    }

    function transferFrom(
        address, address,uint256
    ) public override returns (bool)
    {
        revert("Staking: Transfers disabled");
    }

    // 2. Staking and Lockup Functions

    function stake(
        uint256 amount,
        uint256 duration,
        address to
    ) external {
        if (to == address(0)) {
            to == msg.sender;
        }
        require(amount <= type(uint128).max, "Staking: Too much");
        require(amount > 0, "Staking: Not enough");
        // duration checked inside previewPoints
        (uint256 points, uint256 end) = previewPoints(amount, duration);
        require(points + totalSupply() <= type(uint192).max, "Staking: Max points exceeded");
        _collectRewards(to);
        lockups[to].push(
            Lockup({
                amount: uint128(amount), // max checked in require above
                end: uint128(end),
                points: points
            })
        );
        _mint(to, points);
        rewardDebt[msg.sender] = (balanceOf(msg.sender) * accRewardPerShare) / 1e12;
        ogv.transferFrom(msg.sender, address(this), amount);
        emit Stake(to, lockups[to].length - 1, amount, end, points);
    }

    function unstake(uint256 lockupId, bool noRewards) external {
        Lockup memory lockup = lockups[msg.sender][lockupId];
        uint256 amount = lockup.amount;
        uint256 end = lockup.end;
        uint256 points = lockup.points;
        require(block.timestamp >= end, "Staking: End of lockup not reached");
        if(!noRewards){
            _collectRewards(msg.sender);    
        }
        delete lockups[msg.sender][lockupId]; // Keeps empty in array, so indexes are stable
        _burn(msg.sender, points);
        rewardDebt[msg.sender] = (balanceOf(msg.sender) * accRewardPerShare) / 1e12;
        ogv.transfer(msg.sender, amount);
        emit Unstake(msg.sender, lockupId, amount, end, points);
    }

    function extend(uint256 lockupId, uint256 duration) external {
        // duration checked inside previewPoints
        Lockup memory lockup = lockups[msg.sender][lockupId];
        uint256 oldAmount = lockup.amount;
        uint256 oldEnd = lockup.end;
        uint256 oldPoints = lockup.points;
        (uint256 newPoints, uint256 newEnd) = previewPoints(oldAmount, duration);
        require(newEnd > oldEnd, "New lockup must be longer");
        lockup.end = uint128(newEnd);
        lockup.points = newPoints;
        lockups[msg.sender][lockupId] = lockup;
        _mint(msg.sender, newPoints - oldPoints);
        rewardDebt[msg.sender] = (balanceOf(msg.sender) * accRewardPerShare) / 1e12;
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
        rewardDebt[msg.sender] = (balanceOf(msg.sender) * accRewardPerShare) / 1e12;
    }

    function previewRewards(address user) external view returns (uint256) {
        uint256 supply = totalSupply();
        if (supply == 0 ) {
            return 0; // No one has any points to even get rewards
        }
        uint256 _accRewardPerShare = accRewardPerShare;
        _accRewardPerShare += (rewardsSource.previewRewards() * 1e12) / supply;
        uint256 balance = balanceOf(user);
        uint256 grossReward = (balance * _accRewardPerShare) / 1e12;
        return grossReward - rewardDebt[user];
    }

    function _collectRewards(address user) internal {
        uint256 supply = totalSupply();
        if (supply == 0 ) {
            return; // Increasing accRewardPerShare would be meaningless. 
        }
        accRewardPerShare += (rewardsSource.collectRewards() * 1e12) / supply;
        uint256 balance = balanceOf(user);
        if (balance == 0) {
            return; // Do NOT move this check before `accRewardPerShare +=`
        }
        uint256 grossReward = (balance * accRewardPerShare) / 1e12;
        uint256 netReward = grossReward - rewardDebt[user];
        ogv.transfer(user, netReward);
        emit Reward(user, netReward);
    }
}
