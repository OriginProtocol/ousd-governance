from brownie import *


def main(token_address, merkle_root, staking_address, end_block):
    return MandatoryLockupDistributor.deploy(
        token_address, merkle_root, staking_address, end_block
    )
