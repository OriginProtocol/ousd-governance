from brownie import *

def main(token_address, epoch, reward_target):
    rewards_impl = RewardsSource.deploy(token_address, epoch, reward_target)
    # @TODO Proxy for staking implementation contract
    return Contract.from_abi("RewardsSource", rewards_impl.address, rewards_impl.abi)
