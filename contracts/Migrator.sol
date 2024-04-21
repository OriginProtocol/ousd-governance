// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import "OpenZeppelin/openzeppelin-contracts@4.6.0/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "./Governable.sol";

interface IStaking {
    function delegates(address staker) external view returns (address);

    // From OGVStaking.sol
    function unstakeFrom(address staker, uint256[] memory lockupIds) external returns (uint256, uint256);

    // From ExponentialStaking.sol
    function stake(uint256 amountIn, uint256 duration, address to, bool stakeRewards, int256 lockupId) external;
}

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
    event LockupsMigrated(address indexed user, uint256[] ogvLockupIds, uint256 newDuration);

    error MigrationAlreadyStarted();
    error MigrationIsInactive();
    error MigrationNotComplete();
    error BalanceMismatch(uint256 ogvAmountIn, uint256 expectedOgnAmountOut, uint256 actualOgnAmountOut);
    error LockupIdsRequired();

    constructor(address _ogv, address _ogn, address _ogvStaking, address _ognStaking) {
        ogv = ERC20Burnable(_ogv);
        ogn = ERC20Burnable(_ogn);
        ogvStaking = IStaking(_ogvStaking);
        ognStaking = IStaking(_ognStaking);
    }

    /**
     * @notice Starts the migration and sets it to end after
     *          365 days. Also, approves xOGN to transfer OGN 
     *          held in this contract. Can be invoked only once
     */
    function start() external onlyGovernor {
        if (endTime != 0) {
            revert MigrationAlreadyStarted();
        }

        // Max approve
        ogn.approve(address(ognStaking), type(uint256).max);

        endTime = block.timestamp + 365 days;
    }

    /**
     * @notice Decommissions the contract. Can be called only
     *          after a year since `start()` was invoked. Burns 
     *          all OGV held in the contract and transfers OGN
     *          to address(1).
     */
    function decommission() external {
        // Only after a year of staking
        if (isMigrationActive()) {
            revert MigrationNotComplete();
        }

        emit Decommissioned();

        uint256 ogvBalance = ogv.balanceOf(address(this));
        if (ogvBalance > 0) {
            // Burn all OGV
            ogv.burn(ogvBalance);
        }

        uint256 ognBalance = ogn.balanceOf(address(this));
        if (ognBalance > 0) {
            // OGN doesn't allow burning of tokens. Has `onlyOwner`
            // modifier on `burn` and `burnFrom` methods. Also,
            // `transfer` has a address(0) check. So, this transfers
            // everything to address(1). The `owner` multisig of 
            // OGN token can call `burnFrom(address(1))` later.abi

            ogn.transfer(address(1), ognBalance);
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
     * @notice Solvency Checks
     * 
     * This ensures that the contract never transfers more than
     * desired OGN amount in any case. This takes a balance diff
     * of OGV and OGN and makes sure that the difference adds up.
     * However, it doesn't revert if the difference is in favour
     * of the contract (i.e. less OGN sent than expected).
     */
    modifier netBalanceCheck() {
        uint256 ogvBalanceBefore = ogv.balanceOf(address(this));
        uint256 ognBalanceBefore = ogn.balanceOf(address(this));

        _;

        uint256 netOgvAmountIn = ogv.balanceOf(address(this)) - ogvBalanceBefore;
        uint256 netOgnAmountOut = ognBalanceBefore - ogn.balanceOf(address(this));

        uint256 netExpectedOgnAmountOut = (netOgvAmountIn * CONVERSION_RATE / 1 ether);

        if (netExpectedOgnAmountOut < netOgnAmountOut) {
            // TODO: Do we need some sort of tolerance (may be 0.01%)?
            revert BalanceMismatch(netOgvAmountIn, netExpectedOgnAmountOut, netOgnAmountOut);
        }
    }

    /**
     * @notice Migrates the specified amount of OGV to OGN
     * @param ogvAmount Amount of OGV to migrate
     * @return ognReceived OGN Received
     */
    function migrate(uint256 ogvAmount) external netBalanceCheck returns (uint256 ognReceived) {
        return _migrate(ogvAmount, msg.sender);
    }

    /**
     * @notice Migrates all of user's OGV to OGN
     * @return ognReceived OGN Received
     */
    function migrateAll() external netBalanceCheck returns (uint256 ognReceived) {
        return _migrate(ogv.balanceOf(msg.sender), msg.sender);
    }

    /**
     * @notice Migrates caller's OGV to OGN and sends it to the `receiver`
     * @return ognReceived OGN Received
     */
    function _migrate(uint256 ogvAmount, address receiver) internal returns (uint256 ognReceived) {
        if (!isMigrationActive()) {
            revert MigrationIsInactive();
        }

        ognReceived = ogvAmount * CONVERSION_RATE / 1 ether;

        emit TokenExchanged(ogvAmount, ognReceived);

        ogv.transferFrom(msg.sender, address(this), ogvAmount);

        if (receiver != address(this)) {
            // When migrating stakes, the contract would directly
            // stake the balance on behalf of the user. So there's
            // no need to transfer to self. Transfering to user and then
            // back to this contract would only increase gas cost (and
            // an additional tx for the user).
            ogn.transfer(receiver, ognReceived);
        }
    }

    /**
     * @notice Migrates OGV stakes to OGN. Can also include unstaked OGN & OGV
     *          balances from the user's wallet (if specified). 
     * @param lockupIds OGV Lockup IDs to be migrated
     * @param ogvAmountFromWallet Unstaked OGV balance to migrate & stake
     * @param ognAmountFromWallet Unstaked OGN balance to stake
     * @param migrateRewards If true, Migrate & Stake received rewards
     * @param newStakeDuration Duration of the new stake
     */
    function migrate(
        uint256[] calldata lockupIds,
        uint256 ogvAmountFromWallet,
        uint256 ognAmountFromWallet,
        bool migrateRewards,
        uint256 newStakeDuration
    ) external netBalanceCheck {
        if (!isMigrationActive()) {
            revert MigrationIsInactive();
        }

        if (lockupIds.length == 0) {
            revert LockupIdsRequired();
        }

        // TODO: Migrate delegation

        // Unstake
        (uint256 ogvAmountUnlocked, uint256 rewardsCollected) = ogvStaking.unstakeFrom(msg.sender, lockupIds);

        if (migrateRewards) {
            // Include rewards if needed
            ogvAmountFromWallet += rewardsCollected;
        }

        ogvAmountFromWallet += ogvAmountUnlocked;

        // Migrate OGV to OGN and include that along with existing balance
        ognAmountFromWallet += _migrate(ogvAmountFromWallet, address(this));

        // Stake it
        ognStaking.stake(
            ognAmountFromWallet,
            newStakeDuration,
            msg.sender,
            false,
            -1 // New stake
        );

        // TODO: Emit new lockupId?
        emit LockupsMigrated(msg.sender, lockupIds, newStakeDuration);
    }

}
