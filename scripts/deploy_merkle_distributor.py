from brownie import *
import json

f = open("./scripts/claims.json")
merkle_root = json.load(f)["merkleRoot"]


def main(token_address):
    merkle_distributor = MerkleDistributor.deploy(token_address, merkle_root)

    return merkle_distributor
