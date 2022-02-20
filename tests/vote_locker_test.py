import pytest
import brownie
from brownie import OGV, VoteLocker, accounts

@pytest.fixture
def token():
    return accounts[0].deploy(OGV)

@pytest.fixture
def vote_locker(token):
    return accounts[0].deploy(VoteLocker, token)

def test_name(vote_locker):
    assert vote_locker.name() == "Vote Locked Origin Governance Token"

def test_symbol(vote_locker):
    assert vote_locker.symbol() == "vlOGV"

def test_decimals(vote_locker):
    assert vote_locker.decimals() == 18

def test_initial_total_supply(vote_locker):
    assert vote_locker.totalSupply() == 0

def test_cant_lockup_below_min(vote_locker, token):
    token.approve(vote_locker, 100e18)
    with brownie.reverts("Expiry must be after minimum lockup time"):
        vote_locker.lockup(1, 1) # 1 second

def test_cant_lockup_above_max(vote_locker, token):
    token.approve(vote_locker, 100e18)
    with brownie.reverts("Expiry must be before maximum lockup time"):
        vote_locker.lockup(1, 86400 * 365 * 5) # 5 years

def test_lockup(vote_locker, token):
    lock_amount = 100e18
    token.approve(vote_locker, lock_amount)
    vote_locker.lockup(lock_amount, 86400 * 365) # 1 year lockup
    boosted_amount = lock_amount + lock_amount * 86400 * 365 / (86400 * 365 * 4) * 4
    assert vote_locker.balanceOf(accounts[0]) == boosted_amount
    assert vote_locker.totalSupply() == boosted_amount

def test_extend_lockup_expiry(vote_locker, token):
    token.approve(vote_locker, 100e18)
    vote_locker.lockup(100e18, 86400 * 365) # 1 year lockup

def test_increase_lockup_amount(vote_locker, token):
    token.approve(vote_locker, 100e18)
    vote_locker.lockup(100e18, 86400 * 365) # 1 year lockup
