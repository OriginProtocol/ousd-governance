from brownie import *
from pathlib import Path

# Load OpenZeppelin TimelockController from dependency path
TimelockController = project.load(
    Path.home() / ".brownie" / "packages" / config["dependencies"][0]
).TimelockController


def main():
    token = GovernanceToken.deploy({"from": accounts[0]})
    vl_token = VoteLocker.deploy(token, {"from": accounts[0]})
    timelock_delay = 86400 * 2  # 48 hours
    timelock_controller = TimelockController.deploy(
        timelock_delay, [accounts[0]], [accounts[0]], {"from": accounts[0]}
    )
    OUSDGovernor.deploy(vl_token, timelock_controller, {"from": accounts[0]})
