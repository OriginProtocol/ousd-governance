from brownie import *


def main(token_address, epoch, rewards_address):
    min_staking = 7 * 24 * 60 * 60
    staking_impl = OgvStaking.deploy(token_address, epoch, min_staking, rewards_address)
    # @TODO Proxy for staking implementation contract
    return Contract.from_abi("OgvStaking", staking_impl.address, staking_impl.abi)
