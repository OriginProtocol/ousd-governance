import brownie
from brownie import accounts, chain

from ..helpers import approx, mine_blocks
from ..fixtures import governance, timelock_controller, token, vote_locker

DAY = 86400
WEEK = 7 * DAY


def test_create_proposal(governance, vote_locker, token):
    # Proposal threshold is 2500 veOGV
    token.approve(vote_locker.address, 3000e18)
    vote_locker.lockup(3000e18, chain[-1].timestamp + WEEK * 52 * 4)
    tx = governance.propose(
        ["0xEA2Ef2e2E5A749D4A66b41Db9aD85a38Aa264cb3"],
        [0],
        ["upgradeTo(address)"],
        [0x00000000000000000000000016156A06BD1BD2D80134EA1EE7E5FAEBDBFA20AA],
        "Switch to new Convex implementation",
        {"from": accounts[0]},
    )
    proposal_quorum = governance.quorum(tx.block_number)
    assert approx(proposal_quorum, vote_locker.totalSupplyAt(tx.block_number) * 0.04)

def test_cant_create_proposal_if_below_threshold(governance):
    with brownie.reverts("Governor: proposer votes below proposal threshold"):
        tx = governance.propose(
            ["0xEA2Ef2e2E5A749D4A66b41Db9aD85a38Aa264cb3"],
            [0],
            ["upgradeTo(address)"],
            [0x00000000000000000000000016156A06BD1BD2D80134EA1EE7E5FAEBDBFA20AA],
            "Switch to new Convex implementation",
            {"from": accounts[0]}
        )

def test_can_cancel_proposal(governance, vote_locker, token):
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
    governance.cancel(tx.return_value, { "from": alice })
    assert governance.state(tx.return_value) == 2

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
    mine_blocks(web3)
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
    mine_blocks(web3)
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
    mine_blocks(web3)
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


def test_timelock_proposal_can_be_cancelled(governance, vote_locker, token, timelock_controller, web3):
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
    mine_blocks(web3)
    governance.queue(tx.return_value, {"from": alice})
    assert governance.state(tx.return_value) == 5
    governance.cancel(tx.return_value)
    chain.mine()
    # 2 == canceled. See ProposalState enum here: https://github.com/OpenZeppelin/openzeppelin-contracts/blob/ae270b0d8931c587a987cf3a36e510906e305214/contracts/governance/IGovernor.sol#L14-L22
    assert governance.state(tx.return_value) == 2

    # can not cancel already cancelled proposal
    with brownie.reverts("Governor: proposal not active"):
        governance.cancel(tx.return_value)

def test_timelock_proposal_can_be_cancelled_after_time_passes(governance, vote_locker, token, timelock_controller, web3):
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
    mine_blocks(web3)
    governance.queue(tx.return_value, {"from": alice})
    assert governance.state(tx.return_value) == 5
    chain.sleep(86400 * 2)
    chain.mine()
    # can be cancelled even when voting is already enabled
    governance.cancel(tx.return_value)
    # 2 == canceled. See ProposalState enum here: https://github.com/OpenZeppelin/openzeppelin-contracts/blob/ae270b0d8931c587a987cf3a36e510906e305214/contracts/governance/IGovernor.sol#L14-L22
    assert governance.state(tx.return_value) == 2

def test_timelock_proposal_can_not_be_cancelled_after_is_executed(governance, vote_locker, token, timelock_controller, web3):
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
    mine_blocks(web3)
    governance.queue(tx.return_value, {"from": alice})
    assert governance.state(tx.return_value) == 5
    chain.sleep(86400 * 2)
    chain.mine()
    governance.execute(tx.return_value, {"from": alice})
    assert governance.state(tx.return_value) == 7
    assert governance.votingDelay() == 100
    # can not cancel executed proposal
    with brownie.reverts("Governor: proposal not active"):
        governance.cancel(tx.return_value)
