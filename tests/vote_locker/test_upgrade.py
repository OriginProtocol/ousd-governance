import brownie
from brownie import *
from ..fixtures import token, vote_locker

def test_cant_upgrade_to_non_uups(vote_locker):
    non_uups_token = NonUUPSToken.deploy({ 'from': accounts[0]})
    with brownie.reverts("ERC1967Upgrade: new implementation is not UUPS"):
        vote_locker.upgradeTo(non_uups_token.address)

def test_upgrade(vote_locker):
    upgrade_to = TestVoteLocker.deploy({ 'from': accounts[0]})
    vote_locker.upgradeTo(upgrade_to.address)
    vote_locker = Contract.from_abi("TestVoteLocker", vote_locker.address, upgrade_to.abi)
    with brownie.reverts("Upgraded"):
        vote_locker.proof()

def test_non_owner_cant_upgrade(vote_locker):
    upgrade_to = TestVoteLocker.deploy({ 'from': accounts[0]})
    with brownie.reverts("Ownable: caller is not the owner"):
        vote_locker.upgradeTo(upgrade_to.address, { 'from': accounts[1] })

