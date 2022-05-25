import json
from brownie import *


def main(output_file=None):
    accounts.default = accounts[0]
    # accounts.default = accounts.load("rinkeby_deployer")

    token = run("deploy_token")
    votelock = run("deploy_vote_locker", "main", (token.address,))

    timelock_delay = 86400 * 2  # 48 hours
    timelock_controller = Timelock.deploy(
        [accounts[0]], [accounts[0]]
    )

    governance = Governance.deploy(votelock, timelock_controller)

    # Make the governor the proposer and executor on timelock
    timelock_controller.grantRole(web3.keccak(text="PROPOSER_ROLE"), governance)
    timelock_controller.grantRole(web3.keccak(text="EXECUTOR_ROLE"), governance)

    merkle_distributor = run("deploy_merkle_distributor", "main", (token.address,))

    if output_file:
        output = dict(
            OriginDollarGovernance=dict(address=token.address, abi=token.abi),
            VoteLockerCurve=dict(address=votelock.address, abi=votelock.abi),
            TimelockController=dict(address=timelock_controller.address, abi=timelock_controller.abi),
            Governance=dict(address=governance.address, abi=governance.abi),
            MerkleDistributor=dict(address=merkle_distributor.address, abi=merkle_distributor.abi),
        )
        with open(output_file, "w+") as f:
            json.dump(output, f, indent=2)

    return (token, votelock, timelock_controller, governance, merkle_distributor)
