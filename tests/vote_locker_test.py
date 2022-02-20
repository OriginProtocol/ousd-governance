import pytest

from brownie import OGV, VoteLocker, accounts

@pytest.fixture
def token():
    return accounts[0].deploy(OGV)

@pytest.fixture
def vote_locker(token):
    return accounts[0].deploy(VoteLocker, token)


def test_vote_locked_name(vote_locker):
    assert vote_locker.name() == "Vote Locked Origin Governance Token"

def test_vote_locked_symbol(vote_locker):
    assert vote_locker.symbol() == "vlOGV"
