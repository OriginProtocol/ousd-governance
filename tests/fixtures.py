import pytest
import time
from brownie import OGV, VoteLockerCurve, accounts

@pytest.fixture
def token():
    return accounts[0].deploy(OGV)

@pytest.fixture
def vote_locker(token):
    return accounts[0].deploy(VoteLockerCurve, token)
