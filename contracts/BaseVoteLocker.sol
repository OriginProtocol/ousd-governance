// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

abstract contract BaseVoteLocker {
    ///@notice Definition of a week
    uint256 internal constant WEEK = 7 days;
    ///@notice Maximum lock time
    uint256 public constant MAX_LOCK_TIME = 4 * 365 * 86400; // 4 years

    /**
     * @dev Floors a timestamp to the nearest weekly increment
     * @param _t Timestamp to floor
     * @return Timestamp floored to nearest weekly increment
     */
    function _floorToWeek(uint256 _t) internal pure returns (uint256) {
        return (_t / WEEK) * WEEK;
    }

    /**
     * @dev Returns the largest of two numbers.
     * @param _a First number
     * @param _b Second number
     * @return Largest of _a and _b
     */
    function max(uint256 _a, uint256 _b) internal pure returns (uint256) {
        return _a >= _b ? _a : _b;
    }

    /**
     * @dev Returns the largest of two numbers.
     * @param _a First number
     * @param _b Second number
     * @return Largest of _a and _b
     */
    function max(int128 _a, int128 _b) internal pure returns (int128) {
        return _a >= _b ? _a : _b;
    }
}
