// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import {ERC20Burnable} from
    "OpenZeppelin/openzeppelin-contracts@4.6.0/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {Governable} from "./Governable.sol";

import {IStaking} from "./interfaces/IStaking.sol";

contract Migrator is Governable {
    ERC20Burnable public immutable ogv;
    ERC20Burnable public immutable ogn;

    IStaking public immutable ogvStaking;
    IStaking public immutable ognStaking;

    // Fixed conversion rate
    uint256 public constant CONVERSION_RATE = 0.09137 ether;

    uint256 public endTime;

    event TokenExchanged(uint256 ogvAmountIn, uint256 ognAmountOut);
    event Decommissioned();
    event LockupsMigrated(address indexed user, uint256[] ogvLockupIds, uint256 newStakeAmount, uint256 newDuration);

    error MigrationAlreadyStarted();
    error ContractInsolvent(uint256 expectedOGN, uint256 availableOGN);
    error InvalidStakeAmount();

    constructor(address _ogv, address _ogn, address _ogvStaking, address _ognStaking) {
        ogv = ERC20Burnable(_ogv);
        ogn = ERC20Burnable(_ogn);
        ogvStaking = IStaking(_ogvStaking);
        ognStaking = IStaking(_ognStaking);
    }

    /**
     * @notice Solvency Checks
     *
     * This ensures that the contract always has enough OGN to
     * continue with the migration.
     * However, it doesn't revert if the difference is in favour
     * of the contract (i.e. has more OGN than expected).
     */
    modifier isSolvent() {
        _;

        uint256 availableOGN = ogn.balanceOf(address(this));
        uint256 maxOGNNeeded = (ogv.totalSupply() * CONVERSION_RATE) / 1 ether;

        if (availableOGN < maxOGNNeeded) {
            revert ContractInsolvent(maxOGNNeeded, availableOGN);
        }
    }

    /**
     * @notice Starts the migration and sets it to end after
     *          365 days. Also, approves xOGN to transfer OGN
     *          held in this contract. Can be invoked only once
     */
    function start() external onlyGovernor isSolvent {
        if (endTime != 0) {
            revert MigrationAlreadyStarted();
        }

        // Max approve
        ogn.approve(address(ognStaking), type(uint256).max);

        endTime = block.timestamp + 365 days;
    }

    /**
     * @notice Computes the amount of OGN needed for migration
     *          and if the contract has more OGN than that, it
     *          transfers it back to the treasury. If migration complete, transfers all.
     * @param treasury Address that receives excess OGN
     */
    function transferExcessTokens(address treasury) external onlyGovernor {
        uint256 availableOGN = ogn.balanceOf(address(this));

        if (endTime == 0 || isMigrationActive()) {
            uint256 maxOGNNeeded = (ogv.totalSupply() * CONVERSION_RATE) / 1 ether;
            ogn.transfer(treasury, availableOGN - maxOGNNeeded);
        } else {
            emit Decommissioned();
            ogn.transfer(treasury, availableOGN);
        }
    }

    /**
     * @notice Returns the active status of the migration.
     * @return True if migration has started and has not ended yet.
     */
    function isMigrationActive() public view returns (bool) {
        return endTime > 0 && block.timestamp < endTime;
    }

    /**
     * @notice Migrates the specified amount of OGV to OGN.
     *          Does not check if migration is active since
     *          that's okay (until we decommission).
     * @param ogvAmount Amount of OGV to migrate
     * @return ognReceived OGN Received
     */
    function migrate(uint256 ogvAmount) external isSolvent returns (uint256 ognReceived) {
        return _migrate(ogvAmount, msg.sender);
    }

    /**
     * @notice Migrates OGV stakes to OGN. Can also include unstaked OGN & OGV
     *          balances from the user's wallet (if specified).
     *          Does not check if migration is active since that's okay (until
     *          we decommission the contract).
     * @param lockupIds OGV Lockup IDs to be migrated
     * @param ogvAmountFromWallet Extra OGV balance from user's wallet to migrate & stake
     * @param ognAmountFromWallet Extra OGN balance from user's wallet to stake
     * @param migrateRewards If true, Migrate & Stake received rewards
     * @param newStakeAmount Max amount of OGN (from wallet+unstake) to stake
     * @param newStakeDuration Duration of the new stake
     */
    function migrate(
        uint256[] calldata lockupIds,
        uint256 ogvAmountFromWallet,
        uint256 ognAmountFromWallet,
        bool migrateRewards,
        uint256 newStakeAmount,
        uint256 newStakeDuration
    ) external isSolvent {
        if (lockupIds.length > 0) {
            // Unstake if there are any lockups
            (uint256 ogvAmountUnlocked, uint256 rewardsCollected) = ogvStaking.unstakeFrom(msg.sender, lockupIds);

            ogvAmountFromWallet += ogvAmountUnlocked;

            if (migrateRewards) {
                // Include rewards if needed
                ogvAmountFromWallet += rewardsCollected;
            }
        } else if (migrateRewards) {
            uint256 rewardsCollected = ogvStaking.collectRewardsFrom(msg.sender);
            ogvAmountFromWallet += rewardsCollected;
        }

        if (ognAmountFromWallet > 0) {
            // Transfer in additional OGN to stake from user's wallet
            ogn.transferFrom(msg.sender, address(this), ognAmountFromWallet);
        }

        // Migrate OGV to OGN and include that along with existing balance
        ognAmountFromWallet += _migrate(ogvAmountFromWallet, address(this));

        if (ognAmountFromWallet < newStakeAmount) {
            revert InvalidStakeAmount();
        }

        uint256 ognToWallet = ognAmountFromWallet - newStakeAmount;
        if (ognToWallet > 0) {
            ogn.transfer(msg.sender, ognToWallet);
        }

        if (newStakeAmount > 0) {
            // Stake it
            ognStaking.stake(
                newStakeAmount,
                newStakeDuration,
                msg.sender,
                false,
                -1 // New stake
            );
        }

        emit LockupsMigrated(msg.sender, lockupIds, newStakeAmount, newStakeDuration);
    }

    /**
     * @notice Migrates caller's OGV to OGN and sends it to the `receiver`
     * @return ognReceived OGN Received
     */
    function _migrate(uint256 ogvAmount, address receiver) internal returns (uint256 ognReceived) {
        ognReceived = (ogvAmount * CONVERSION_RATE) / 1 ether;

        emit TokenExchanged(ogvAmount, ognReceived);

        ogv.burnFrom(msg.sender, ogvAmount);

        if (receiver != address(this)) {
            // When migrating stakes, the contract would directly
            // stake the balance on behalf of the user. So there's
            // no need to transfer to self. Transfering to user and then
            // back to this contract would only increase gas cost (and
            // an additional tx for the user).
            ogn.transfer(receiver, ognReceived);
        }
    }
}
