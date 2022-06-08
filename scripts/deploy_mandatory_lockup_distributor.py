from brownie import *
from .deploy_optional_lockup_distributor import merkle_data

def main(token_address, staking_address):
    merkle_root = merkle_data["merkle_root"]
    return MandatoryLockupDistributor.deploy(
        token_address, merkle_root, staking_address
    )
