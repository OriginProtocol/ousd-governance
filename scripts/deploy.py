import json
from brownie import *


def main(output_file=None):
    accounts.default = accounts[0]
    # accounts.default = accounts.load("rinkeby_deployer")

    token = run("deploy_token")

    epoch = 86400  # 1 day

    rewards = run("deploy_rewards", "main", (token.address,))
    staking = run("deploy_staking", "main", (token.address, epoch, rewards.address))

    timelock_controller = Timelock.deploy([accounts[0]], [accounts[0]])

    governance = Governance.deploy(staking, timelock_controller)

    # Make the governor the proposer and executor on timelock
    timelock_controller.grantRole(web3.keccak(text="PROPOSER_ROLE"), governance)
    timelock_controller.grantRole(web3.keccak(text="EXECUTOR_ROLE"), governance)

    if output_file:
        output = dict(
            OriginDollarGovernance=dict(address=token.address, abi=token.abi),
            RewardsSource=dict(address=rewards.address, abi=rewards.abi),
            OgvStaking=dict(address=staking.address, abi=staking.abi),
            TimelockController=dict(
                address=timelock_controller.address, abi=timelock_controller.abi
            ),
            Governance=dict(address=governance.address, abi=governance.abi),
        )
        with open(output_file, "w+") as f:
            json.dump(output, f, indent=2)

    return (token, rewards, staking, timelock_controller, governance)
