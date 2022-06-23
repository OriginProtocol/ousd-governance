from brownie import *


def main(token_address, epoch, rewards_address):
    staking_impl = OgvStaking.deploy(token_address, epoch, rewards_address)
    # @TODO Proxy for staking implementation contract
    return Contract.from_abi("OgvStaking", staking_impl.address, staking_impl.abi)
