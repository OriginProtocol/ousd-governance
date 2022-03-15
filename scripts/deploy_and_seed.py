from brownie import *

DAY = 86400
WEEK = DAY * 7

def main(output_file=None):
    (token, votelock, timelock_controller, governance) = run("deploy", args=[output_file])
    for i, account in enumerate(accounts, start=1):
        token.mint(account.address, 100e18, { "from": accounts[0] })
        token.approve(votelock, 100e18, { "from": account })
        votelock.lockup(100e18, chain.time() + i * 10 * WEEK, { "from": account })

    for i in range(0, 10):
        governance.propose(
            [governance.address],
            [0],
            ["setVotingDelay(uint256)"],
            ["0x0000000000000000000000000000000000000000000000000000000000000064"],
            "Proposal {}".format(i),
            {"from": accounts[0]},
        )

