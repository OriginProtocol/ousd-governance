// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../VoteLockerCurve.sol";

contract TestVoteLocker is VoteLockerCurve {
    function proof() public {
      revert("Upgraded");
    }
}
