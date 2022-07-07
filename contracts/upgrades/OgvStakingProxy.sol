// SPDX-License-Identifier: MIT

pragma solidity 0.8.10;

import {ERC1967Proxy} from "./ERC1967Proxy.sol";

/// @author Origin Protocol
/// @custom:security-contact security@originprotocol.com
contract OgvStakingProxy is ERC1967Proxy {
	constructor(address _logic, bytes memory _data) ERC1967Proxy(_logic, _data){
	}
}
