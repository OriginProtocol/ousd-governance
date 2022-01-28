// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "ds-test/test.sol";

import "src/VoteLocker.sol";
import "src/GovernanceToken.sol";

contract VoteLockerTest is DSTest {

  VoteLocker voteLocker;
  ERC20 governanceToken;

  // The state of the contract gets reset before each
  // test is run, with the `setUp()` function being called
  // each time after deployment, now + 86400.
  function setUp() public {
    governanceToken = new GovernanceToken();
    voteLocker = new VoteLocker(address(governanceToken));
  }

  function testStakingToken() public {
    assertEq(address(governanceToken), address(voteLocker.stakingToken()));
  }

  function testTokenName() public {
    assertEq(voteLocker.name(), "Vote Locked Governance Token");
  }

  function testTokenSymbol() public {
    assertEq(voteLocker.symbol(), "vlGOV");
  }

  function testTokenDecimals() public {
    assertEq(voteLocker.decimals(), 18);
  }

  function testCreateMaxLockup() public {
    governanceToken.approve(address(voteLocker), 100 * 10 ** 18);
    voteLocker.deposit(100 * 10 ** 18, block.timestamp + (86400 * 4 * 365));
    assertEq(voteLocker.balanceOf(address(this)), 400 * 10 ** 18);
  }

  function testCreateMinLockup() public {
    governanceToken.approve(address(voteLocker), 100 * 10 ** 18);
    voteLocker.deposit(100 * 10 ** 18, block.timestamp + (86400 * 7));
    assertEq(voteLocker.balanceOf(address(this)), 100 * 10 ** 18);
  }

  function testFailLockupMinimum() public {
    voteLocker.deposit(100 * 10 ** 18, block.timestamp + 86400);
  }

  function testFailLockupMaximum() public {
  }

  function testIncreaseLockupAmount() public {
  }

  function testIncreaseLockupExpiry() public {
  }
}
