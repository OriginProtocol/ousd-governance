from brownie import *
from pathlib import Path

def main():
    token_impl = OriginDollarGovernance.deploy({"from": accounts[0]})
    token_proxy = ERC1967Proxy.deploy(token_impl.address, token_impl.initialize.encode_input(), {"from": accounts[0]})
    token = Contract.from_abi("OriginDollarGovernance", token_proxy.address, token_impl.abi)
    return token
