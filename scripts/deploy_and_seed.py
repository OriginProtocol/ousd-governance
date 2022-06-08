from brownie import *


def main(output_file=None):
    (token, votelock, timelock_controller, governance) = run(
        "deploy", args=[output_file]
    )
    for i, account in enumerate(accounts, start=1):
        token.mint(account.address, 100e18, {"from": accounts[0]})
