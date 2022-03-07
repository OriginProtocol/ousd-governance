import pytest
from brownie import Governance, GovernanceToken, VoteLockerCurve, Timelock, accounts

@pytest.fixture
def token():
    return accounts[0].deploy(GovernanceToken)

@pytest.fixture
def vote_locker(token):
    return accounts[0].deploy(VoteLockerCurve, token)

@pytest.fixture
def timelock_controller():
    return accounts[0].deploy(Timelock, [accounts[0]], [accounts[0]])

@pytest.fixture
def governance(vote_locker, timelock_controller, web3):
    governance = accounts[0].deploy(Governance, vote_locker, timelock_controller)
    timelock_controller.grantRole(web3.keccak(text="PROPOSER_ROLE"), governance)
    timelock_controller.grantRole(web3.keccak(text="EXECUTOR_ROLE"), governance)
    return governance
