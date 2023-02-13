// SPDX-License-Identifier: Unlicense
pragma solidity 0.8.10;

import "forge-std/Test.sol";
import "contracts/OgvStaking.sol";
import "contracts/RewardsSource.sol";
import "contracts/tests/MockOGV.sol";

//
// Sanity test of OpenZeppelin's voting and delegation.
//

contract DelegationTest is Test {
    using stdStorage for StdStorage;

    MockOGV ogv;
    OgvStaking staking;
    RewardsSource source;

    address oak = address(0x42);
    address aspen = address(0x43);
    address taz = address(0x44);
    address alice = address(0x45);
    address bob = address(0x46);
    address attacker = address(0x47);
    address team = address(0x50);

    uint256 constant EPOCH = 1 days;

    uint256 POINTS = 0;

    function setUp() public {
        vm.startPrank(team);
        ogv = new MockOGV();
        source = new RewardsSource(address(ogv));
        staking = new OgvStaking(address(ogv), EPOCH, 7 days, address(source));
        source.setRewardsTarget(address(staking));
        vm.stopPrank();

        ogv.mint(oak, 1000 ether);
        ogv.mint(aspen, 1000 ether);
        ogv.mint(taz, 100000000 ether);

        vm.prank(oak);
        ogv.approve(address(staking), 1e70);
        vm.prank(aspen);
        ogv.approve(address(staking), 1e70);
        vm.prank(taz);
        ogv.approve(address(staking), 1e70);

        vm.prank(oak);
        staking.stake(1 ether, 100 days);
        vm.prank(aspen);
        staking.stake(2 ether, 100 days);
        vm.prank(taz);
        staking.stake(1 ether, 100 days, alice); // Stake for alice

        POINTS = staking.balanceOf(oak);
    }

    function testAutoDelegateOnStake() external {
        vm.roll(1);
        
        // Can vote immediately after staking
        assertEq(staking.getVotes(oak), 1 * POINTS, "can vote after staking");
        assertEq(staking.getPastVotes(oak, block.number - 1), 0, "should not have voting power before staking");
        assertEq(staking.delegates(oak), oak, "self-delegated after staking");
        
        vm.roll(2);

        // Can opt out of voting after staking
        vm.prank(oak);
        staking.delegate(address(0));
        assertEq(staking.getVotes(oak), 0, "zero after delegation removed");
        assertEq(staking.getPastVotes(oak, block.number - 1), 1 * POINTS);
        assertEq(staking.delegates(oak), address(0));
    }

    function testAutoDelegateOnStakeToOthers() external {
        vm.roll(1);
        
        // Alice should have voting power after taz stakes for her
        assertEq(staking.getVotes(alice), POINTS, "can vote after staking");
        assertEq(staking.getVotes(taz), 0, "should not have voting power");
        assertEq(staking.getPastVotes(alice, block.number - 1), 0, "should not have voting power before staking");
        assertEq(staking.getPastVotes(taz, block.number - 1), 0, "should not have voting power");
        assertEq(staking.delegates(alice), alice, "delegated to receiver after staking");
        assertEq(staking.delegates(taz), address(0), "should not have a delegatee set");
        
        vm.roll(2);

        // Alice can opt out of voting after staking
        vm.prank(alice);
        staking.delegate(address(0));
        assertEq(staking.getVotes(alice), 0, "zero after delegation removed");
        assertEq(staking.getPastVotes(alice, block.number - 1), 1 * POINTS);
        assertEq(staking.delegates(alice), address(0));
    }

    function testDelegateOnExtendAfterRenounce() external {
        vm.roll(1);
        
        // Can vote immediately after staking
        assertEq(staking.getVotes(oak), 1 * POINTS, "can vote after staking");
        assertEq(staking.getPastVotes(oak, block.number - 1), 0, "should not have voting power before staking");
        assertEq(staking.delegates(oak), oak, "self-delegated after staking");

        vm.roll(2);
        // Can renounce voting powers
        vm.prank(oak);
        staking.delegate(address(0));
        assertEq(staking.getVotes(oak), 0, "zero after delegation removed");
        assertEq(staking.getPastVotes(oak, block.number - 1), 1 * POINTS);
        assertEq(staking.delegates(oak), address(0));

        vm.roll(3);
        // Extend shouldn't change manual override
        vm.prank(oak);
        staking.extend(0, 200 days);
        assertEq(staking.delegates(oak), address(0), "should not change delegation on extend");
        assertEq(staking.getVotes(oak), 0, "zero after delegation removed");
    }

    function testDelegateOnExtendAfterTransfer() external {
        vm.roll(1);
        
        // Can vote immediately after staking
        assertEq(staking.getVotes(oak), 1 * POINTS, "can vote after staking");
        assertEq(staking.delegates(oak), oak, "self-delegated after staking");

        vm.roll(2);
        // Can move voting power
        vm.prank(oak);
        staking.delegate(alice);
        assertEq(staking.getVotes(oak), 0, "zero after delegation removed");
        assertEq(staking.delegates(oak), alice);

        vm.roll(3);
        // Extend shouldn't change manual override
        vm.prank(oak);
        staking.extend(0, 200 days);
        assertEq(staking.delegates(oak), alice, "should not change delegation on extend");
    }

    function testDelegateOnExtendForOlderStakes() external {
        // For test purposes, undo auto-staking on user
        vm.prank(oak);
        staking.delegate(address(0));
        stdstore.target(address(staking))
            .sig(staking.hasDelegationSet.selector)
            .with_key(oak)
            .checked_write(false);

        vm.roll(1);
        
        // Cannot vote because test undid auto-staking
        assertEq(staking.getVotes(oak), 0, "can not vote");
        assertEq(staking.delegates(oak), address(0), "no delegation");
        assertEq(staking.hasDelegationSet(oak), false, "no hasDelegationSet");

        // Extend should auto-delegate
        vm.prank(oak);
        staking.extend(0, 200 days);
        assertEq(staking.delegates(oak), oak, "should auto delegate on extend");
        assertEq(staking.hasDelegationSet(oak), true, "should have hasDelegationSet");
        assertGt(staking.getVotes(oak), 1 * POINTS, "should have voting power after extend");
    }

    function testDelegate() external {
        vm.roll(1);
        assertEq(staking.getVotes(oak), 1 * POINTS, "can vote after staking");
        assertEq(staking.getPastVotes(oak, block.number - 1), 0, "should not have voting power before staking");
        assertEq(staking.delegates(oak), oak, "self-delegated after staking");

        vm.roll(2);
        vm.prank(oak);
        staking.delegate(aspen);
        assertEq(staking.delegates(aspen), aspen);
        assertEq(staking.delegates(oak), aspen);
        assertEq(
            staking.getVotes(aspen),
            // Voting power of self + oak
            3 * POINTS,
            "can vote after delegation"
        );
        assertEq(staking.getPastVotes(aspen, block.number - 1), 2 * POINTS, "can vote after staking");
    }

    function testRenounceVotingPower() external {
        vm.roll(1);

        // Can vote immediately after staking
        assertEq(staking.getVotes(oak), 1 * POINTS, "can vote after staking");
        assertEq(staking.getPastVotes(oak, block.number - 1), 0, "should not have voting power before staking");
        assertEq(staking.delegates(oak), oak, "self-delegated after staking");
        
        // Can opt out of voting
        vm.roll(2);
        vm.prank(oak);
        staking.delegate(address(0));
        assertEq(staking.delegates(oak), address(0), "should renouce voting power");
        assertEq(staking.getVotes(oak), 0, "should not have voting power after renouncing");
        assertEq(staking.getPastVotes(oak, block.number - 1), 1 * POINTS, "can vote before renouncing");
    }

    function testSkipAutoDelegateIfDelegated() external {
        vm.roll(1);

        // Can vote immediately after staking
        assertEq(staking.getVotes(oak), 1 * POINTS, "can vote after staking");
        assertEq(staking.getPastVotes(oak, block.number - 1), 0, "should not have voting power before staking");
        assertEq(staking.delegates(oak), oak, "self-delegated after staking");
        
        // Delegate to someone else
        vm.roll(2);
        vm.prank(oak);
        staking.delegate(bob);
        assertEq(staking.delegates(oak), bob, "should set a delegate");
        assertEq(staking.getVotes(oak), 0, "should not have voting power");
        assertEq(staking.getVotes(bob), 1 * POINTS, "should have voting power after delegation");

        // Stake some more
        vm.roll(3);
        vm.prank(oak);
        staking.stake(1 ether, 100 days);
        assertEq(staking.getVotes(oak), 0, "cannot vote after delegation");
        assertEq(staking.getVotes(bob), 2 * POINTS, "should have voting power after delegation");
        assertEq(staking.delegates(oak), bob, "no change in delegation after staking");
    }

    function testRenounceAttack() external {
        // Alice can vote, because she is staked
        assertEq(staking.getVotes(alice), 1 * POINTS, "can vote after staking");

        // Alice renounces voting.
        vm.prank(alice);
        staking.delegate(address(0));

        // Attacker attacks
        vm.startPrank(attacker);
        ogv.mint(attacker, 1 ether);
        ogv.approve(address(staking), 1 ether);
        staking.stake(1 ether, 100 days, alice);
        vm.stopPrank();

        vm.roll(2);

        // Alice should still have renounced voting
        assertEq(staking.getVotes(alice), 0, "can't vot after renouncing");
    }

    
}
