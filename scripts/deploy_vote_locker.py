from brownie import *
from pathlib import Path

def main(token_address):
    votelock_impl = VoteLockerCurve.deploy({"from": accounts[0]})
    votelock_proxy = ERC1967Proxy.deploy(votelock_impl.address, votelock_impl.initialize.encode_input(token_address), {"from": accounts[0]})
    votelock = Contract.from_abi("VoteLockerCurve", votelock_proxy.address, votelock_impl.abi)
    return votelock
