import pytest
import brownie
from ..helpers import approx, H, DAY, WEEK, MONTH, YEAR, MAXTIME, TOL, mine_blocks, ZERO_ADDRESS
from ..fixtures import token, governance, timelock_controller, vote_locker
amount = 1000 * 10 ** 18

@pytest.fixture(scope="module", autouse=True)
def setup(token, accounts, chain, vote_locker):
    alice, bob, mikey = accounts[:3]
    token.transfer(bob, amount, {"from": alice})
    token.transfer(mikey, amount, {"from": alice})

    token.approve(vote_locker.address, amount * 10, {"from": alice})
    token.approve(vote_locker.address, amount * 10, {"from": bob})
    token.approve(vote_locker.address, amount * 10, {"from": mikey})

    # Move to timing which is good for testing - beginning of a UTC week
    chain.sleep((chain[-1].timestamp // WEEK + 1) * WEEK - chain[-1].timestamp)
    chain.mine()
    chain.sleep(H)

    vote_locker.lockup(amount, chain[-1].timestamp + WEEK, {"from": alice})
    vote_locker.lockup(amount, chain[-1].timestamp + WEEK, {"from": bob})
    vote_locker.lockup(amount, chain[-1].timestamp + WEEK, {"from": mikey})

    chain.sleep(H)
    chain.mine()

# achieves isolation between different test function runs
@pytest.fixture(autouse=True)
def isolation(fn_isolation):
    pass

def test_delegation(web3, accounts, chain, token, vote_locker):
    alice, bob, mikey = accounts[:3]
    initial_block_number = chain.height
    assert vote_locker.delegates(alice) == ZERO_ADDRESS
    assert vote_locker.delegates(bob) == ZERO_ADDRESS

    vote_locker.delegate(bob, {"from": alice})
    chain.mine()
    assert vote_locker.delegates(alice) == bob

    vote_locker.delegate(ZERO_ADDRESS, {"from": alice})
    chain.mine()
    assert vote_locker.delegates(alice) == ZERO_ADDRESS

def test_redelegation(accounts, chain, vote_locker):
    alice, bob = accounts[:2]

    vote_locker.delegate(bob, {"from": alice})
    chain.mine()
    assert vote_locker.delegates(alice) == bob

    # re-delegating shouldn't have any effect
    vote_locker.delegate(bob, {"from": alice})
    chain.mine()
    assert vote_locker.delegates(alice) == bob

def test_voting_powers_delegated(web3, accounts, chain, token, vote_locker):
    alice, bob, mikey = accounts[:3]
    votig_power_unit = amount // MAXTIME * (WEEK - 2 * H)

    assert approx(vote_locker.totalSupply(), votig_power_unit * 3, TOL)
    assert approx(vote_locker.balanceOf(alice), votig_power_unit, TOL)
    assert approx(vote_locker.balanceOf(mikey), votig_power_unit, TOL)
    assert approx(vote_locker.balanceOf(bob), votig_power_unit, TOL)
    vote_locker.delegate(mikey, {"from": bob})
    chain.mine()
    assert approx(vote_locker.totalSupply(), votig_power_unit * 3, TOL)
    assert approx(vote_locker.balanceOf(mikey), votig_power_unit * 2, TOL)
    assert approx(vote_locker.balanceOf(bob), 0, TOL)
    vote_locker.delegate(ZERO_ADDRESS, {"from": bob})
    chain.mine()
    assert approx(vote_locker.totalSupply(), votig_power_unit * 3, TOL)
    assert approx(vote_locker.balanceOf(mikey), votig_power_unit, TOL)
    assert approx(vote_locker.balanceOf(bob), votig_power_unit, TOL)
    assert approx(vote_locker.balanceOf(alice), votig_power_unit, TOL)

def test_delegation_gas_usage(governance, chain, accounts, vote_locker, token, timelock_controller, web3):
    alice, bob, mikey = accounts[:3]
    vote_locker.delegate(alice, {"from": bob})
    vote_locker.delegate(alice, {"from": mikey})

    for curr_account in accounts[3:25]:
        alice.transfer(curr_account, "0.1 ether")
        token.transfer(curr_account, amount, {"from": alice})
        token.approve(vote_locker.address, amount * 10, {"from": curr_account})
        vote_locker.lockup(amount, chain[-1].timestamp + MAXTIME, {"from": curr_account})
        # make everyone delegate to alice
        vote_locker.delegate(alice, {"from": curr_account})
        # a month
        mine_blocks(web3, "0x2cbe8")

    token.approve(vote_locker.address, amount * 10, {"from": alice})
    vote_locker.lockup(amount, chain[-1].timestamp + MAXTIME, {"from": alice})

    # 2 years in nr of blocks
    mine_blocks(web3, "0x25c0bc")
    mine_blocks(web3, "0x25c0bc")

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

    tx1 = governance.castVote(tx.return_value, 1, {"from": alice})

    #print("GAS USED: ", tx1.gas_used)
    assert tx1.gas_used < 700000

def test_delegation_vote_power(governance, chain, accounts, vote_locker, token, timelock_controller, web3):
    alice, bob, mikey = accounts[:3]
    votig_power_unit = amount

    for curr_account in accounts[1:10]:
        alice.transfer(curr_account, "0.1 ether")
        token.transfer(curr_account, amount, {"from": alice})
        token.approve(vote_locker.address, amount * 10, {"from": curr_account})
        vote_locker.lockup(amount, chain[-1].timestamp + MAXTIME, {"from": curr_account})
        # make everyone delegate to alice
        vote_locker.delegate(alice, {"from": curr_account})

    token.approve(vote_locker.address, amount, {"from": alice})
    vote_locker.lockup(amount, chain[-1].timestamp + MAXTIME, {"from": alice})

    assert approx(vote_locker.totalSupply(), votig_power_unit * 10, TOL)
    assert approx(vote_locker.balanceOf(alice), votig_power_unit * 10, TOL)

    time_before = chain.time()

    # In dev environment node wont have similar block mining times as on mainnet. To try
    # to get as close to that as possible simulate 1 year block mining by mining week's worth
    # of blocks and sleep for a week's worth of time
    while chain.time() - time_before < YEAR:
        chain.sleep(WEEK)
        mine_blocks(web3)

    assert approx(vote_locker.totalSupply(), votig_power_unit * 10 / 4 * 3, TOL)
    assert approx(vote_locker.balanceOf(alice), votig_power_unit * 10 / 4 * 3, TOL)

    vote_locker.delegate(ZERO_ADDRESS, {"from": bob})
    vote_locker.delegate(ZERO_ADDRESS, {"from": mikey})

    assert approx(vote_locker.totalSupply(), votig_power_unit * 10 / 4 * 3, TOL)
    assert approx(vote_locker.balanceOf(bob), votig_power_unit / 4 * 3, TOL)
    assert approx(vote_locker.balanceOf(mikey), votig_power_unit / 4 * 3, TOL)
    assert approx(vote_locker.balanceOf(alice), votig_power_unit * 8 / 4 * 3, TOL)

    vote_locker.delegate(alice, {"from": bob})
    vote_locker.delegate(alice, {"from": mikey})

    assert approx(vote_locker.totalSupply(), votig_power_unit * 10 / 4 * 3, TOL)
    assert approx(vote_locker.balanceOf(alice), votig_power_unit * 10 / 4 * 3, TOL)

    time_before = chain.time()

    while chain.time() - time_before < YEAR:
        chain.sleep(WEEK)
        mine_blocks(web3)

    assert approx(vote_locker.totalSupply(), votig_power_unit * 10 / 2, TOL * 1.2)
    assert approx(vote_locker.balanceOf(alice), votig_power_unit * 10 / 2, TOL * 1.2)

    vote_locker.delegate(ZERO_ADDRESS, {"from": bob})
    vote_locker.delegate(ZERO_ADDRESS, {"from": mikey})

    assert approx(vote_locker.totalSupply(), votig_power_unit * 10 / 2, TOL * 1.2)
    assert approx(vote_locker.balanceOf(bob), votig_power_unit / 2, TOL * 1.2)
    assert approx(vote_locker.balanceOf(mikey), votig_power_unit / 2, TOL * 1.2)
    assert approx(vote_locker.balanceOf(alice), votig_power_unit * 8 / 2, TOL * 1.2)

    vote_locker.delegate(alice, {"from": bob})
    vote_locker.delegate(alice, {"from": mikey})

    assert approx(vote_locker.totalSupply(), votig_power_unit * 10 / 2, TOL * 1.2)
    assert approx(vote_locker.balanceOf(alice), votig_power_unit * 10 / 2, TOL * 1.2)
