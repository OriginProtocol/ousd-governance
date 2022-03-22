import brownie
from brownie import *
from pathlib import Path
from .fixtures import token

def test_name(token): assert token.name() == "Origin Dollar Governance"

def test_symbol(token):
    assert token.symbol() == "OGV"

def test_decimals(token):
    assert token.decimals() == 18

def test_initial_total_supply(token):
    assert token.totalSupply() == 1000000000 * 10 ** 18

def test_owner(token):
    assert token.owner() == accounts[0]

def test_transfer_ownership(token):
    token.transferOwnership(accounts[1])
    assert token.owner() == accounts[1]

def test_non_owner_cant_mint(token):
    with brownie.reverts("Ownable: caller is not the owner"):
        token.mint(accounts[1], 100, { 'from': accounts[1] })

def test_owner_can_mint(token):
    token.mint(accounts[1], 100, { 'from': accounts[0] })
    assert token.totalSupply() == 1000000000 * 10 ** 18 + 100

def test_cant_upgrade_to_non_uups(token):
    non_uups_token = NonUUPSToken.deploy({ 'from': accounts[0]})
    with brownie.reverts("ERC1967Upgrade: new implementation is not UUPS"):
        token.upgradeTo(non_uups_token.address)

def test_upgrade(token):
    upgrade_to = TestToken.deploy({ 'from': accounts[0]})
    token.upgradeTo(upgrade_to.address)
    token = Contract.from_abi("TestToken", token.address, upgrade_to.abi)
    with brownie.reverts("Upgraded"):
        token.proof()

def test_non_owner_cant_upgrade(token):
    upgrade_to = TestToken.deploy({ 'from': accounts[0]})
    with brownie.reverts("Ownable: caller is not the owner"):
        token.upgradeTo(upgrade_to.address, { 'from': accounts[1] })
