from brownie import accounts, chain

from ..helpers import approx
from ..fixtures import governance, timelock_controller, token, vote_locker

DAY = 86400
WEEK = 7 * DAY

def test_create_proposal(governance):
    tx = governance.propose(
        ["0xEA2Ef2e2E5A749D4A66b41Db9aD85a38Aa264cb3"],
        [0],
        ["upgradeTo(address)"],
        [0x00000000000000000000000016156A06BD1BD2D80134EA1EE7E5FAEBDBFA20AA],
        "Switch to new Convex implementation",
        {"from": accounts[0]},
    )

    id = tx.return_value

    proposal_quorum = governance.quorum(tx.block_number)

    assert proposal_quorum == 0


def test_proposal_can_pass_vote(governance, vote_locker, token):
    alice = accounts[0]
    amount = 1000 * 10 ** 18
    token.approve(vote_locker.address, amount * 10, {"from": alice})
    vote_locker.upsertLockup(amount, chain[-1].timestamp + WEEK, {"from": alice})

    tx = governance.propose(
        ["0xEA2Ef2e2E5A749D4A66b41Db9aD85a38Aa264cb3"],
        [0],
        ["upgradeTo(address)"],
        [0x00000000000000000000000016156A06BD1BD2D80134EA1EE7E5FAEBDBFA20AA],
        "Switch to new Convex implementation",
        {"from": accounts[0]},
    )

    proposal_quorum = governance.quorum(tx.block_number)
    expected_quorum = vote_locker.totalSupplyAt(tx.block_number) * 0.04

    assert approx(proposal_quorum, expected_quorum)
