from brownie import *


def main(token_address, staking_address, merkle_root):
    return MandatoryLockupDistributor.deploy(
        token_address, merkle_root, staking_address
    )
