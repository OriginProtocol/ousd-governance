import json
from brownie import *


def main(output_file=None):
    (token, _, _, _, merkle_mandatory, merkle_optional, _) = run(
        "deploy", args=(output_file,)
    )
    # Transfer to the distributors so they have OGV to give out
    token.transfer(merkle_mandatory, 50000 * 10e18, {"from": accounts[0]})
    token.transfer(merkle_optional, 50000 * 10e18, {"from": accounts[0]})
