// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.10;

import "forge-std/Script.sol";
import {PRBMathUD60x18} from "paulrberg/prb-math@2.5.0/contracts/PRBMathUD60x18.sol";

import "forge-std/console.sol";

contract OgvStakingScript is Script {

    uint256 private constant epoch = 1657584000;
    uint256 private constant SECONDS_IN_A_MONTH = 2629800; // 365.25 * (24 * 60 * 60) / 12

    uint256 constant YEAR_BASE = 18e17;
    
    function run() public {
        vm.warp(1644405478);
        (uint256 points, uint256 end) = (previewPoints(800000000e18, 6 * SECONDS_IN_A_MONTH));
        console.log(points);
    }

    function previewPoints(uint256 amount, uint256 duration)
        public
        view
        returns (uint256, uint256)
    {
        // Basically always block.timestamp
        uint256 start = block.timestamp > epoch ? block.timestamp : epoch;
        uint256 end = start + duration;
        uint256 endYearpoc = ((end - epoch) * 1e18) / 365 days;
        uint256 multiplier = PRBMathUD60x18.pow(YEAR_BASE, endYearpoc);
        return ((amount * multiplier) / 1e18, end);
    }
}
