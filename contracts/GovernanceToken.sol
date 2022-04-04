// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "OpenZeppelin/openzeppelin-contracts-upgradeable@a16f26a063cd018c4c986832c3df332a131f53b9/contracts/token/ERC20/ERC20Upgradeable.sol";
import "OpenZeppelin/openzeppelin-contracts-upgradeable@a16f26a063cd018c4c986832c3df332a131f53b9/contracts/access/OwnableUpgradeable.sol";
import "OpenZeppelin/openzeppelin-contracts-upgradeable@a16f26a063cd018c4c986832c3df332a131f53b9/contracts/proxy/utils/Initializable.sol";
import "OpenZeppelin/openzeppelin-contracts-upgradeable@a16f26a063cd018c4c986832c3df332a131f53b9/contracts/proxy/utils/UUPSUpgradeable.sol";

/// @custom:security-contact security@originprotocol.com
contract OriginDollarGovernance is
    Initializable,
    ERC20Upgradeable,
    OwnableUpgradeable,
    UUPSUpgradeable
{
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() initializer {}

    function initialize() public initializer {
        __ERC20_init("Origin Dollar Governance", "OGV");
        __Ownable_init();
        __UUPSUpgradeable_init();

        _mint(msg.sender, 1000000000 * 10**decimals());
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyOwner
    {}
}
