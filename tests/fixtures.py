import pytest
from brownie import accounts
from brownie import OGV, VoteLockerCurve

@pytest.fixture
def token():
    return accounts[0].deploy(OGV)

@pytest.fixture
def vote_locker(token):
    return accounts[0].deploy(VoteLockerCurve, token)

@pytest.fixture
def now():
    return int(time.time())
