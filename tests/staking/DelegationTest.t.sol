// SPDX-License-Identifier: Unlicense
pragma solidity 0.8.10;

import "forge-std/Test.sol";
import "contracts/OgvStaking.sol";
import "contracts/RewardsSource.sol";
import "contracts/tests/MockOGV.sol";

//
// Sanity test of OpenZeppelin's voting and deletegation.
//

contract DelegationTest is Test {
    MockOGV ogv;
    OgvStaking staking;
    RewardsSource source;

    address oak = address(0x42);
    address aspen = address(0x43);
    address taz = address(0x44);
    address alice = address(0x45);
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

    function testAutoDelegate() external {
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

    function testAutoDelegate2() external {
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
}
