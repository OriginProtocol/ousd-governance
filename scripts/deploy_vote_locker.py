from brownie import *
from pathlib import Path

def main(token_address):
    votelock_impl = VoteLockerCurve.deploy()
    votelock_proxy = ERC1967Proxy.deploy(votelock_impl.address, votelock_impl.initialize.encode_input(token_address))
    votelock = Contract.from_abi("VoteLockerCurve", votelock_proxy.address, votelock_impl.abi)
    return votelock
