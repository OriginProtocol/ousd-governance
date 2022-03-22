// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "OpenZeppelin/openzeppelin-contracts-upgradeable@4.5.0/contracts/token/ERC20/ERC20Upgradeable.sol";
import "OpenZeppelin/openzeppelin-contracts-upgradeable@4.5.0/contracts/access/OwnableUpgradeable.sol";
import "OpenZeppelin/openzeppelin-contracts-upgradeable@4.5.0/contracts/proxy/utils/Initializable.sol";
import "OpenZeppelin/openzeppelin-contracts-upgradeable@4.5.0/contracts/proxy/utils/UUPSUpgradeable.sol";

contract TestToken is
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

    function proof() public {
      revert("Upgraded");
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyOwner
    {}
}
