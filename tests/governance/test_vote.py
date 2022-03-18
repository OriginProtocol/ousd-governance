from brownie import accounts, chain

from ..helpers import approx, mine_blocks, DAY, WEEK
from ..fixtures import governance, timelock_controller, token, vote_locker


def test_create_proposal(governance):
    tx = governance.propose(
        ["0xEA2Ef2e2E5A749D4A66b41Db9aD85a38Aa264cb3"],
        [0],
        ["upgradeTo(address)"],
        [0x00000000000000000000000016156A06BD1BD2D80134EA1EE7E5FAEBDBFA20AA],
        "Switch to new Convex implementation",
        {"from": accounts[0]},
    )
    proposal_quorum = governance.quorum(tx.block_number)
    assert proposal_quorum == 0


def test_proposal_can_pass_vote(governance, vote_locker, token, timelock_controller, web3):
    alice = accounts[0]
    amount = 1000 * 10 ** 18
    token.approve(vote_locker.address, amount * 10, {"from": alice})
    vote_locker.lockup(amount, chain[-1].timestamp + WEEK, {"from": alice})
    tx = governance.propose(
        [governance.address],
        [0],
        ["setVotingDelay(uint256)"],
        ["0x0000000000000000000000000000000000000000000000000000000000000064"],
        "Set voting delay",
        {"from": accounts[0]},
    )
    proposal_quorum = governance.quorum(tx.block_number)
    expected_quorum = vote_locker.totalSupplyAt(tx.block_number) * 0.04
    assert approx(proposal_quorum, expected_quorum)
    chain.mine()
    governance.castVote(tx.return_value, 1, {"from": alice})
    proposal = governance.proposals(tx.return_value)
    # Active
    assert governance.state(tx.return_value) == 1
    mine_blocks(web3, chain)
    # Succeeded
    assert governance.state(tx.return_value) == 4


def test_proposal_can_fail_vote(governance, vote_locker, token, timelock_controller, web3):
    alice = accounts[0]
    bob = accounts[1]
    amount = 1000 * 10 ** 18
    token.transfer(bob, amount * 2, {"from": accounts[0]})
    token.approve(vote_locker.address, amount * 10, {"from": alice})
    token.approve(vote_locker.address, amount * 10 * 2, {"from": bob})
    vote_locker.lockup(amount, chain[-1].timestamp + WEEK, {"from": alice})
    vote_locker.lockup(amount * 2, chain[-1].timestamp + WEEK, {"from": bob})
    tx = governance.propose(
        [governance.address],
        [0],
        ["setVotingDelay(uint256)"],
        ["0x0000000000000000000000000000000000000000000000000000000000000064"],
        "Set voting delay",
        {"from": accounts[0]},
    )
    proposal_quorum = governance.quorum(tx.block_number)
    expected_quorum = vote_locker.totalSupplyAt(tx.block_number) * 0.04
    assert approx(proposal_quorum, expected_quorum)
    chain.mine()
    governance.castVote(tx.return_value, 1, {"from": alice})
    governance.castVote(tx.return_value, 0, {"from": bob})
    chain.mine()
    # Active
    assert governance.state(tx.return_value) == 1
    mine_blocks(web3, chain)
    # Defeated
    assert governance.state(tx.return_value) == 3


def test_proposal_can_be_queued_and_executed_in_timelock(governance, vote_locker, token, timelock_controller, web3):
    alice = accounts[0]
    amount = 1000 * 10 ** 18
    token.approve(vote_locker.address, amount * 10, {"from": alice})
    vote_locker.lockup(amount, chain[-1].timestamp + WEEK, {"from": alice})
    tx = governance.propose(
        [governance.address],
        [0],
        ["setVotingDelay(uint256)"],
        ["0x0000000000000000000000000000000000000000000000000000000000000064"],
        "Set voting delay",
        {"from": accounts[0]},
    )
    chain.mine()
    governance.castVote(tx.return_value, 1, {"from": alice})
    mine_blocks(web3, chain)
    governance.queue(tx.return_value, {"from": alice})
    assert governance.state(tx.return_value) == 5
    chain.sleep(86400 * 2)
    chain.mine()
    governance.execute(tx.return_value, {"from": alice})
    assert governance.state(tx.return_value) == 7
    assert governance.votingDelay() == 100

def test_late_vote_extends_quorum(governance, vote_locker, token, timelock_controller, web3):
    alice = accounts[0]
    amount = 1000 * 10 ** 18
    token.approve(vote_locker.address, amount * 10, {"from": alice})
    vote_locker.lockup(amount, chain[-1].timestamp + WEEK, {"from": alice})
    tx = governance.propose(
        [governance.address],
        [0],
        ["setVotingDelay(uint256)"],
        ["0x0000000000000000000000000000000000000000000000000000000000000064"],
        "Set voting delay",
        {"from": accounts[0]},
    )
    mine_blocks(web3, "0xB2C8") # 50 less than is required for vote end
    governance.castVote(tx.return_value, 1, {"from": alice})
    proposal = governance.proposals(tx.return_value)
    # Extends for a day beyond the current block
    assert proposal[4] == (86400 / 15) + web3.eth.block_number


def test_timelock_proposal_can_be_cancelled(governance, vote_locker, token, timelock_controller):
    pass


