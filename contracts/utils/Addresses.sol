// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

library Addresses {
    address public constant TIMELOCK = 0x35918cDE7233F2dD33fA41ae3Cb6aE0e42E0e69F;
    address public constant STRATEGIST = 0xF14BBdf064E3F67f51cd9BD646aE3716aD938FDC;
    address public constant GOVERNOR_FIVE = 0x3cdD07c16614059e66344a7b579DAB4f9516C0b6;

    address public constant OGN_GOVERNOR = 0x72426BA137DEC62657306b12B1E869d43FeC6eC7;
    address public constant GOV_MULTISIG = 0xbe2AB3d3d8F6a32b96414ebbd865dBD276d3d899;

    address public constant INITIAL_DEPLOYER = address(0x1001);
    address public constant OGN = 0x8207c1FfC5B6804F6024322CcF34F29c3541Ae26;
    address public constant OGV = 0x9c354503C38481a7A7a51629142963F98eCC12D0;
    address public constant OGV_REWARDS_PROXY = 0x7d82E86CF1496f9485a8ea04012afeb3C7489397;
    address public constant VEOGV = 0x0C4576Ca1c365868E162554AF8e385dc3e7C66D9;

    address public constant OUSD_BUYBACK = 0xD7B28d06365b85933c64E11e639EA0d3bC0e3BaB;
    address public constant OETH_BUYBACK = 0xFD6c58850caCF9cCF6e8Aee479BFb4Df14a362D2;
    address public constant OUSD_BUYBACK_IMPL = 0x386d8fEC5b6d5B5E36a48A376644e36239dB65d6;
    address public constant OETH_BUYBACK_IMPL = 0x4F11d31f781B57051764a3823b24d520626b4833;
}

library AddressesBase {
    // 5/8 multisig
    address public constant GOVERNOR = 0x92A19381444A001d62cE67BaFF066fA1111d7202;
}

library AddressesSonic {
    // 5/8 multisig
    address public constant ADMIN = 0xAdDEA7933Db7d83855786EB43a238111C69B00b6;
}
