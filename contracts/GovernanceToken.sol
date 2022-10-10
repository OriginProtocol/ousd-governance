// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./upgrades/ERC20BurnableUpgradeable.sol";
import "OpenZeppelin/openzeppelin-contracts-upgradeable@4.6.0/contracts/access/OwnableUpgradeable.sol";
import "OpenZeppelin/openzeppelin-contracts-upgradeable@4.6.0/contracts/access/AccessControlUpgradeable.sol";
import "OpenZeppelin/openzeppelin-contracts-upgradeable@4.6.0/contracts/proxy/utils/Initializable.sol";
import "OpenZeppelin/openzeppelin-contracts-upgradeable@4.6.0/contracts/proxy/utils/UUPSUpgradeable.sol";

/// @custom:security-contact security@originprotocol.com
contract OriginDollarGovernance is
    Initializable,
    ERC20BurnableUpgradeable,
    OwnableUpgradeable,
    UUPSUpgradeable,
    AccessControlUpgradeable
{
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() initializer {}

    function initialize() public initializer {
        __ERC20_init("Origin Dollar Governance", "OGV");
        __Ownable_init();
        __UUPSUpgradeable_init();

        _mint(msg.sender, 1000000000 * 10**decimals());
    }

    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    function grantMinterRole(address _account) public onlyOwner {
        _grantRole(MINTER_ROLE, _account);
    }

    function grantAdminRole(address _account) public onlyOwner {
        _grantRole(DEFAULT_ADMIN_ROLE, _account);
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyOwner
    {}
}
