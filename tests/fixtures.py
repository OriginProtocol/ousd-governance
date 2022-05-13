import pytest
from brownie import *
from pathlib import Path
from .helpers import DAY

@pytest.fixture
def token():
    accounts.default = accounts[0]
    return run("deploy_token")

@pytest.fixture
def rewards(token):
    return run("deploy_rewards", "main", (token.address,))

@pytest.fixture
def staking(token, rewards):
    return run("deploy_staking", "main", (token.address, DAY, rewards.address))

@pytest.fixture
def timelock_controller():
    return accounts[0].deploy(Timelock, [accounts[0]], [accounts[0]])

@pytest.fixture
def governance(staking, timelock_controller, web3):
    governance = accounts[0].deploy(Governance, staking, timelock_controller)
    timelock_controller.grantRole(web3.keccak(text="PROPOSER_ROLE"), governance)
    timelock_controller.grantRole(web3.keccak(text="EXECUTOR_ROLE"), governance)
    timelock_controller.grantRole(web3.keccak(text="CANCELLER_ROLE"), governance)
    return governance
