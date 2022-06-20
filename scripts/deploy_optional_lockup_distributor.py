from brownie import *


def main(token_address, staking_address, merkle_root, end_block):
    return OptionalLockupDistributor.deploy(token_address, merkle_root, staking_address, end_block)
