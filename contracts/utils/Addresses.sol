// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

library Addresses {
    address public constant TIMELOCK = 0x35918cDE7233F2dD33fA41ae3Cb6aE0e42E0e69F;
    address public constant STRATEGIST = 0xF14BBdf064E3F67f51cd9BD646aE3716aD938FDC;
    address public constant GOVERNOR_FIVE = 0x3cdD07c16614059e66344a7b579DAB4f9516C0b6;

    address public constant INITIAL_DEPLOYER = address(0x1001);
    address public constant OGN = 0x8207c1FfC5B6804F6024322CcF34F29c3541Ae26;
    address public constant OGV = 0x9c354503C38481a7A7a51629142963F98eCC12D0;
    address public constant OGV_REWARDS_PROXY = 0x7d82E86CF1496f9485a8ea04012afeb3C7489397;
    address public constant VEOGV = 0x0C4576Ca1c365868E162554AF8e385dc3e7C66D9;

    address public constant OUSD_BUYBACK = address(34);
    address public constant OETH_BUYBACK = address(35);
    address public constant OUSD_BUYBACK_IMPL = address(34);
    address public constant OETH_BUYBACK_IMPL = address(35);
}
