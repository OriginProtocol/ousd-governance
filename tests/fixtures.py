import pytest
from brownie import *
from pathlib import Path

H = 3600
DAY = 86400
WEEK = 7 * DAY
MAXTIME = 4 * 365 * DAY
TOL = 120 / WEEK
ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

Proxy = project.load(
    Path.home() / ".brownie" / "packages" / config["dependencies"][0]
).ERC1967Proxy

@pytest.fixture(scope="module")
def token():
    accounts.default = accounts[0]
    token_impl = OriginDollarGovernance.deploy({"from": accounts[0]})
    token_proxy = Proxy.deploy(token_impl.address, token_impl.initialize.encode_input(), {"from": accounts[0]})
    token = Contract.from_abi("OriginDollarGovernance", token_proxy.address, token_impl.abi)
    return token


@pytest.fixture(scope="module")
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
