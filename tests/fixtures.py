import pytest
from brownie import *
from pathlib import Path

@pytest.fixture
def token():
    accounts.default = accounts[0]
    return run("deploy_token")

@pytest.fixture
def vote_locker(token):
    return run("deploy_vote_locker", "main", (token.address,))

@pytest.fixture
def timelock_controller():
    return accounts[0].deploy(Timelock, [accounts[0]], [accounts[0]])

@pytest.fixture
def governance(vote_locker, timelock_controller, web3):
    governance = accounts[0].deploy(Governance, vote_locker, timelock_controller)
    timelock_controller.grantRole(web3.keccak(text="PROPOSER_ROLE"), governance)
    timelock_controller.grantRole(web3.keccak(text="EXECUTOR_ROLE"), governance)
    timelock_controller.grantRole(web3.keccak(text="CANCELLER_ROLE"), governance)
    return governance
