pragma solidity 0.8.10;
import {ERC20Votes} from "OpenZeppelin/openzeppelin-contracts@4.6.0/contracts/token/ERC20/extensions/ERC20Votes.sol";
import {ERC20Permit} from "OpenZeppelin/openzeppelin-contracts@4.6.0/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
import {ERC20} from "OpenZeppelin/openzeppelin-contracts@4.6.0/contracts/token/ERC20/ERC20.sol";
import {PRBMathUD60x18} from "paulrberg/prb-math@2.5.0/contracts/PRBMathUD60x18.sol";

contract OgvStaking is ERC20Votes {
    // 1. Core Storage

    ERC20 public immutable ogv;
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

    uint256 constant MAX_REWARDS_UPDATE = 24 * 30 days;
    mapping(address => uint256) public rewardDebt;
    uint256 public accRewardPerShare; // As of the start of the block
    uint256 public lastRewardTime;
    uint256 public rewardRate;
    uint256[] public rewardMonths;

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

    constructor(address ogv_, uint256 epoch_)
        ERC20("", "")
        ERC20Permit("OGV Staking")
    {
        ogv = ERC20(ogv_);
        epoch = epoch_;
    }

    function name() public pure override returns (string memory) {
        return "OGVe";
    }

    function symbol() public pure override returns (string memory) {
        return "Staked OGV";
    }

    function transfer(address to, uint256 amount)
        public
        override
        returns (bool)
    {
        revert();
    }

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public override returns (bool) {
        revert();
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
        // duration checked inside previewPoints
        uint256 start = block.timestamp;
        if (start < epoch) {
            start = epoch;
        }
        uint128 end = uint128(start + duration);
        uint256 points = previewPoints(amount, duration);
        _collectRewards(to);
        lockups[to].push(
            Lockup({
                amount: uint128(amount), // max checked in require above
                end: end,
                points: points
            })
        );
        _mint(to, points);
        ogv.transferFrom(msg.sender, address(this), amount);
        emit Stake(to, lockups[to].length - 1, amount, end, points);
    }

    function unstake(uint256 lockupId) external {
        Lockup memory lockup = lockups[msg.sender][lockupId];
        uint256 amount = lockup.amount;
        uint256 end = lockup.end;
        uint256 points = lockup.points;
        require(block.timestamp >= end, "Staking: End of lockup not reached");
        _collectRewards(msg.sender);
        delete lockups[msg.sender][lockupId]; // Keeps empty in array, so indexes are stable
        _burn(msg.sender, points);
        ogv.transfer(msg.sender, amount);
        emit Unstake(msg.sender, lockupId, amount, end, points);
    }

    function extend(uint256 lockupId, uint256 duration) external {
        // duration checked inside previewPoints
        Lockup memory lockup = lockups[msg.sender][lockupId];
        uint256 oldAmount = lockup.amount;
        uint256 oldEnd = lockup.end;
        uint256 oldPoints = lockup.points;
        uint256 start = block.timestamp;
        if (start < epoch) {
            start = epoch;
        }
        uint256 newEnd = start + duration;
        require(newEnd > oldEnd, "New lockup must be longer");
        uint256 newPoints = previewPoints(oldAmount, duration);
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
        returns (uint256)
    {
        require(duration >= 7 days, "Staking: Too short");
        require(duration <= 1461 days, "Staking: Too long");
        uint256 _epoch = epoch; // Gas savings
        uint256 start = block.timestamp > _epoch ? block.timestamp : _epoch;
        uint256 endYearpoc = ((start + duration - _epoch) * 1e18) / 360 days;
        uint256 multiplier = PRBMathUD60x18.pow(YEAR_BASE, endYearpoc);
        return (amount * multiplier) / 1e18;
    }

    // 3. Reward functions

    function previewRewards(address user) external view returns (uint256) {
        (
            uint256 _accRewardPerShare,
            uint256 _lastRewardTime
        ) = _previewUpdateRewards();
        uint256 balance = balanceOf(user);
        uint256 preReward = (balance * _accRewardPerShare) / 1e12;
        return preReward - rewardDebt[user];
    }

    function collectRewards() external {
        _collectRewards(msg.sender);
    }

    function updateRewards() public {
        (
            uint256 _accRewardPerShare,
            uint256 _lastRewardTime
        ) = _previewUpdateRewards();
        accRewardPerShare = _accRewardPerShare;
        lastRewardTime = _lastRewardTime;
    }

    function _collectRewards(address user) internal {
        (
            uint256 _accRewardPerShare,
            uint256 _lastRewardTime
        ) = _previewUpdateRewards();
        accRewardPerShare = _accRewardPerShare;
        lastRewardTime = _lastRewardTime;

        uint256 balance = balanceOf(user);
        if (balance == 0) {
            return;
        }
        uint256 preReward = (balance * _accRewardPerShare) / 1e12;
        uint256 reward = preReward - rewardDebt[user];

        rewardDebt[user] = preReward;
        ogv.transfer(user, reward);
        emit Reward(user, reward);
    }

    function _previewUpdateRewards() internal view returns (uint256, uint256) {
        uint256 _accRewardPerShare = accRewardPerShare;
        uint256 _lastRewardTime = lastRewardTime;
        if (_lastRewardTime >= block.timestamp) {
            return (_accRewardPerShare, _lastRewardTime);
        }
        uint256 supply = totalSupply();
        if (supply == 0) {
            return (_accRewardPerShare, block.timestamp);
        }
        uint256 end = block.timestamp;
        if (end - _lastRewardTime > MAX_REWARDS_UPDATE) {
            end = _lastRewardTime + MAX_REWARDS_UPDATE;
        }
        uint256 newRewards = rewardsBetween(_lastRewardTime, end);
        _accRewardPerShare += (newRewards * 1e12) / supply;
        return (_accRewardPerShare, end);
    }

    function rewardsBetween(uint256 start, uint256 end)
        public
        view
        returns (uint256)
    {
        uint256 _epoch = epoch;
        if (rewardMonths.length == 0) {
            return 0;
        }
        if (end <= _epoch) {
            return 0;
        }
        if (end <= start) {
            return 0;
        }
        if (start < _epoch) {
            start = _epoch;
        }
        uint256 startMonth = (start - _epoch) / 30 days;
        uint256 endMonth = (end - _epoch) / 30 days;
        if (endMonth >= rewardMonths.length) {
            endMonth = rewardMonths.length - 1;
        }
        uint256 totalRewards = 0;
        for (uint256 i = startMonth; i <= endMonth; i++) {
            uint256 monthRewards = rewardMonths[i];
            uint256 monthStart = _epoch + (i * 30 days);
            uint256 monthEnd = monthStart + 30 days;
            uint256 durationStart = start < monthStart ? monthStart : start;
            uint256 durationEnd = end > monthEnd ? monthEnd : end;
            totalRewards +=
                (monthRewards * (durationEnd - durationStart)) /
                30 days;
        }
        return totalRewards;
    }

    function addRewards(uint256 start, uint256[] calldata amounts) external {
        uint256 beforeLen = rewardMonths.length;
        require(
            (block.timestamp < epoch) ||
                (start > ((block.timestamp - epoch) / 30 days)),
            "Staking: Can only add to future"
        );
        require(start <= beforeLen, "Staking: Start too far");
        uint256 total = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            uint256 amount = amounts[i];
            total += amount;
            if (start + i >= beforeLen) {
                rewardMonths.push(amount);
            } else {
                rewardMonths[start + i] += amount;
            }
        }
        ogv.transferFrom(msg.sender, address(this), total);
    }
}