import { ERC20Snapshot } from "openzeppelin-contracts/contracts/token/ERC20/extensions/ERC20Snapshot.sol";
import { ERC20 } from "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import { PRBMathUD60x18 } from "prb-math/PRBMathUD60x18.sol";

contract Ogve is ERC20Snapshot {
	uint256 YEAR_BASE = 18e17;
	ERC20 immutable public ogv;
	uint256 public epoch; // Not immutable, needs to persist through upgrades.
	struct Lockup {
		uint128 amount;
		uint128 end;
		uint256 points;
	}
	mapping(address => Lockup[]) public lockups;
	mapping(address => uint256) public rewardDebt;
	uint256 public accRewardPerShare; // As of the start of the block
	uint256 public lastRewardTime;
	uint256 public rewardRate;

	event Stake(address indexed user, uint256 lockupId, uint256 amount, uint256 end, uint256 points);
	event Unstake(address indexed user, uint256 lockupId, uint256 amount, uint256 end, uint256 points);
	event Reward(address indexed user, uint256 amount);

	constructor(address ogv_) ERC20("","") {
		ogv = ERC20(ogv_);
		epoch = block.timestamp;
	}

	function name() public pure override returns (string memory) { return "OGVe"; }
	function symbol() public pure override returns (string memory) { return "Staked OGV"; }
	
	function transfer(address to, uint256 amount) public override returns (bool) { revert(); }
	function transferFrom(address from, address to, uint256 amount) public override returns (bool) { revert(); }

	function _getCurrentSnapshotId() internal view override returns(uint256) { return block.number; } // Snapshots are block based

	function stake(uint256 amount, uint256 duration, address to) external {
		if(to == address(0)){ to == msg.sender; }
		require(duration >= 7 days, 'Staking: Too short');
		require(duration <= 1461 days, 'Staking: Too long');
		require(amount <= type(uint128).max, 'Staking: Too much');
		uint128 end = uint128(block.timestamp + duration);
		uint256 points = previewPoints(amount, duration);
		_doRewards(to);
		lockups[to].push(Lockup({
			amount: uint128(amount),
			end: end,
			points: points
		}));
		_mint(to, points);
		ogv.transferFrom(msg.sender, address(this), amount);
		emit Stake(to, lockups[to].length - 1, amount, end, points);
	}

	function unstake(uint256 lockupId) external {
		Lockup memory lockup = lockups[msg.sender][lockupId];
		uint256 amount = lockup.amount;
		uint256 end = lockup.end;
		uint256 points = lockup.points;
		require(block.timestamp >= end, "Staking: End of staking not reached");
		_doRewards(msg.sender);
		delete lockups[msg.sender][lockupId]; // Keeps empty in array, so indexes are stable
		_burn(msg.sender, points);
		ogv.transfer(msg.sender, amount);
		emit Unstake(msg.sender, lockupId, amount, end, points);
	}

	function previewPoints(uint256 amount, uint256 duration) public view returns (uint256) {
		uint256 endYearpoc = ( block.timestamp + duration - epoch ) * 1e18 / 360 days;
		uint256 multiplier = PRBMathUD60x18.pow(YEAR_BASE, endYearpoc);
		return amount * multiplier / 1e18;
	}

	function collectReward() external { _doRewards(msg.sender); }

	function _doRewards(address user) internal {
		updateRewards();
		uint256 balance = balanceOf(user);
		if(balance == 0){ return; }
		uint256 preReward = balance * accRewardPerShare / 1e12; 
		uint256 reward = preReward - rewardDebt[user];
		rewardDebt[user] = preReward; 
		ogv.transfer(user, reward);
		emit Reward(user, reward);
	}

	function updateRewards() public{
		uint256 _lastRewardTime = lastRewardTime;
		if(_lastRewardTime > block.timestamp){ return; }
		uint256 supply = totalSupply();
		if(supply == 0){
			lastRewardTime = block.timestamp;
			return;
		}
		uint256 newRewards = rewardRate * (block.timestamp - lastRewardTime); // TODO: Magic that decides how many to give
		accRewardPerShare += newRewards * 1e12 / supply;
		lastRewardTime = block.timestamp;
	}
	
	function tempRemoveMeRewardRatePerSec(uint256 rate) external {
		rewardRate = rate;
	}
}