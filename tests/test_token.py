import brownie
from brownie import *
from .fixtures import token


def test_name(token):
    assert token.name() == "Origin Dollar Governance"


def test_symbol(token):
    assert token.symbol() == "OGV"


def test_decimals(token):
    assert token.decimals() == 18


def test_initial_total_supply(token):
    assert token.totalSupply() == 1000000000 * 10**18


def test_owner(token):
    assert token.owner() == accounts[0]


def test_transfer_ownership(token):
    token.transferOwnership(accounts[1])
    assert token.owner() == accounts[1]


def test_non_owner_cant_mint(token):
    with brownie.reverts(
        "AccessControl: account 0x4370823e0453bae9f6b6b790daa7d02fd158719f is missing role 0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6"
    ):
        token.mint(accounts[1], 100, {"from": accounts[1]})


def test_minter_can_mint(token):
    token.grantMinterRole(accounts[0], {"from": accounts[0]})
    token.mint(accounts[1], 100, {"from": accounts[0]})
    assert token.totalSupply() == 1000000000 * 10**18 + 100


def test_cant_upgrade_to_non_uups(token):
    non_uups_token = NonUUPSToken.deploy({"from": accounts[0]})
    with brownie.reverts("ERC1967Upgrade: new implementation is not UUPS"):
        token.upgradeTo(non_uups_token.address)


def test_upgrade(token):
    upgrade_to = TestToken.deploy({"from": accounts[0]})
    token.upgradeTo(upgrade_to.address)
    token = Contract.from_abi("TestToken", token.address, upgrade_to.abi)
    with brownie.reverts("Upgraded"):
        token.proof()


def test_non_owner_cant_upgrade(token):
    upgrade_to = TestToken.deploy({"from": accounts[0]})
    with brownie.reverts("Ownable: caller is not the owner"):
        token.upgradeTo(upgrade_to.address, {"from": accounts[1]})
