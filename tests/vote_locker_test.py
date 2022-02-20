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
    token.approve(vote_locker, 100 * 10 ** 18)
    with brownie.reverts("Expiry must be after minimum lockup time"):
        vote_locker.lockup(1, 1) # 1 second

def test_cant_lockup_above_max(vote_locker, token):
    token.approve(vote_locker, 100 * 10 ** 18)
    with brownie.reverts("Expiry must be before maximum lockup time"):
        vote_locker.lockup(1, 86400 * 365 * 5) # 5 years

def test_lockup(vote_locker, token):
    token.approve(vote_locker, 100 * 10 ** 18)
    vote_locker.lockup(100 * 10 ** 18, 86400 * 365) # 1 year lockup

def test_extend_lockup_expiry(vote_locker, token):
    token.approve(vote_locker, 100 * 10 ** 18)
    vote_locker.lockup(100 * 10 ** 18, 86400 * 365) # 1 year lockup

def test_increase_lockup_amount(vote_locker, token):
    token.approve(vote_locker, 100 * 10 ** 18)
    vote_locker.lockup(100 * 10 ** 18, 86400 * 365) # 1 year lockup
