import json
from brownie import *
from pathlib import Path

Proxy = project.load(
    Path.home() / ".brownie" / "packages" / config["dependencies"][0]
).ERC1967Proxy

def main(output_file=None):
    token_impl = OriginDollarGovernance.deploy({"from": accounts[0]})
    token_proxy = Proxy.deploy(token_impl.address, token_impl.initialize.encode_input(), {"from": accounts[0]})
    token = Contract.from_abi("OriginDollarGovernance", token_proxy.address, token_impl.abi)
    votelock = VoteLockerCurve.deploy(token, {"from": accounts[0]})
    timelock_delay = 86400 * 2  # 48 hours
    timelock_controller = Timelock.deploy(
        [accounts[0]], [accounts[0]], {"from": accounts[0]}
    )
    governance = Governance.deploy(votelock, timelock_controller, {"from": accounts[0]})
    # Make the governor the proposer and executor on timelock
    timelock_controller.grantRole(web3.keccak(text="PROPOSER_ROLE"), governance)
    timelock_controller.grantRole(web3.keccak(text="EXECUTOR_ROLE"), governance)

    if output_file:
        output = dict(
            OriginDollarGovernance=dict(address=token.address, abi=token.abi),
            VoteLockerCurve=dict(address=votelock.address, abi=votelock.abi),
            TimelockController=dict(address=timelock_controller.address, abi=timelock_controller.abi),
            Governance=dict(address=governance.address, abi=governance.abi),
        )
        with open(output_file, "w+") as f:
            json.dump(output, f, indent=2)

    return (token, votelock, timelock_controller, governance)
