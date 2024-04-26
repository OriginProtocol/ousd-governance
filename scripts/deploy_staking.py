from brownie import *


def main(token_address, epoch, rewards_address, mock=False):
    min_staking = 7 * 24 * 60 * 60
    if mock:
        staking_impl = MockOGVStaking.deploy(token_address, epoch, min_staking, rewards_address, "0x0000000000000000000000000000000000000011")
        return Contract.from_abi("MockOGVStaking", staking_impl.address, staking_impl.abi)

    staking_impl = OgvStaking.deploy(token_address, epoch, min_staking, rewards_address, "0x0000000000000000000000000000000000000011")
    # @TODO Proxy for staking implementation contract
    return Contract.from_abi("OgvStaking", staking_impl.address, staking_impl.abi)
