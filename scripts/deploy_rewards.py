from brownie import *


def main(token_address):
    rewards_impl = RewardsSource.deploy(token_address)
    # @TODO Proxy for staking implementation contract
    return Contract.from_abi("RewardsSource", rewards_impl.address, rewards_impl.abi)
