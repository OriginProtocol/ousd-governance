import json
from brownie import *
import os

EPOCH = 1657584000  # start of rewards: Tuesday, July 12, 2022 12:00:00 AM UTC
EST_EPOCH_BLOCK = 15124542
MANDATORY_END_BLOCK = (
    int((60 * 60 * 24 * 30 * 3) / 13.2) + EST_EPOCH_BLOCK
)  # 3 months later
OPTIONAL_END_BLOCK = MANDATORY_END_BLOCK


def main(
    output_file=None,
):
    mandatory_lockup_claims = open(
        "./scripts/{}_data/mandatory_lockup_claims.json".format(web3.chain_id)
    )
    optional_lockup_claims = open(
        "./scripts/{}_data/optional_lockup_claims.json".format(web3.chain_id)
    )
    mandatory_lockup_merkle_root = json.load(mandatory_lockup_claims)["merkleRoot"]
    optional_lockup_merkle_root = json.load(optional_lockup_claims)["merkleRoot"]

    if web3.chain_id == 1:
        accounts.default = accounts.load("deployer")
    elif web3.chain_id == 5:
        accounts.default = accounts.load("goerli_deployer")
    else:
        accounts.default = accounts[0]

    token = run("deploy_token")

    rewards = run("deploy_rewards", "main", (token.address,))
    staking = run("deploy_staking", "main", (token.address, EPOCH, rewards.address))

    timelock_controller = Timelock.deploy([accounts[0]], [accounts[0]])

    governance = Governance.deploy(staking, timelock_controller)

    merkle_mandatory = run(
        "deploy_mandatory_lockup_distributor",
        "main",
        (
            token.address,
            mandatory_lockup_merkle_root,
            staking.address,
            MANDATORY_END_BLOCK,
        ),
    )
    merkle_optional = run(
        "deploy_optional_lockup_distributor",
        "main",
        (
            token.address,
            optional_lockup_merkle_root,
            staking.address,
            OPTIONAL_END_BLOCK,
        ),
    )

    # if dev environment fund the contracts
    token.transfer(
        merkle_mandatory.address, 100000000 * 1e18, {"from": accounts[0]}
    )
    token.transfer(merkle_optional.address, 100000000 * 1e18, {"from": accounts[0]})
    if os.getenv('ACCOUNT_TO_FUND') is not None:
        token.transfer(os.getenv('ACCOUNT_TO_FUND'), 100000000 * 1e18, {"from": accounts[0]})

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
            MandatoryDistributor=dict(
                address=merkle_mandatory.address, abi=merkle_mandatory.abi
            ),
            OptionalDistributor=dict(
                address=merkle_optional.address, abi=merkle_optional.abi
            ),
        )
        with open(output_file, "w+") as f:
            json.dump(output, f, indent=2)

    return (
        token,
        staking,
        timelock_controller,
        governance,
        merkle_mandatory,
        merkle_optional,
        rewards,
    )
