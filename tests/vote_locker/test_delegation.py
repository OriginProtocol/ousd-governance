import pytest
import brownie
from ..helpers import approx, H, DAY, WEEK, MAXTIME, TOL, mine_blocks
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
    assert vote_locker.delegates(mikey) == ZERO_ADDRESS
    assert vote_locker.delegators(alice) == []
    assert vote_locker.delegators(bob) == []
    assert vote_locker.delegators(mikey) == []

    vote_locker.delegate(bob, {"from": alice})
    chain.mine()
    assert vote_locker.delegates(alice) == bob
    assert vote_locker.delegators(bob) == [alice]

    vote_locker.delegate(bob, {"from": mikey})
    chain.mine()
    assert vote_locker.delegates(mikey) == bob
    assert vote_locker.delegators(bob) == [alice, mikey]

    vote_locker.delegate(mikey, {"from": alice})
    chain.mine()
    assert vote_locker.delegates(alice) == mikey
    assert vote_locker.delegators(mikey) == [alice]
    assert vote_locker.delegators(bob) == [mikey]
    block_number = chain.height

    vote_locker.delegate(ZERO_ADDRESS, {"from": alice})
    chain.mine()
    assert vote_locker.delegates(alice) == ZERO_ADDRESS
    assert vote_locker.delegators(bob) == [mikey]
    assert vote_locker.delegators(mikey) == []
    chain.mine()

    assert vote_locker.delegates(alice, block_number) == mikey
    assert vote_locker.delegators(mikey, block_number) == [alice]
    assert vote_locker.delegators(bob, block_number) == [mikey]

    assert vote_locker.delegates(alice, initial_block_number) == ZERO_ADDRESS
    assert vote_locker.delegates(bob, initial_block_number) == ZERO_ADDRESS
    assert vote_locker.delegates(mikey, initial_block_number) == ZERO_ADDRESS
    assert vote_locker.delegators(alice, initial_block_number) == []
    assert vote_locker.delegators(bob, initial_block_number) == []
    assert vote_locker.delegators(mikey, initial_block_number) == []

def test_redelegation(accounts, chain, vote_locker):
    alice, bob = accounts[:2]

    vote_locker.delegate(bob, {"from": alice})
    chain.mine()
    assert vote_locker.delegates(alice) == bob
    assert vote_locker.delegators(bob) == [alice]

    # re-delegating shouldn't have any effect
    vote_locker.delegate(bob, {"from": alice})
    chain.mine()
    assert vote_locker.delegates(alice) == bob
    assert vote_locker.delegators(bob) == [alice]

def test_voting_powers_delegated(web3, accounts, chain, token, vote_locker):
    alice, bob, mikey = accounts[:3]
    votig_power_unit = amount // MAXTIME * (WEEK - 2 * H)
    votig_power_half_unit = votig_power_unit // 2

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

# see that delegators with 0 voting power get removed
def test_cleaning_up_delegators(web3, accounts, chain, token, vote_locker):
    # only first 3 accounts have voting powers
    alice, bob, mikey, vain1, vain2, vain3 = accounts[:6]
    
    vote_locker.delegate(alice, {"from": bob})
    vote_locker.delegate(alice, {"from": mikey})
    vote_locker.delegate(alice, {"from": vain1})
    vote_locker.delegate(alice, {"from": vain2})
    vote_locker.delegate(alice, {"from": vain3})
    
    assert vote_locker.delegators(alice) == [bob, mikey, vain1, vain2, vain3]

    vote_locker.cleanUpWeakDelegators(alice, {"from": alice})

    assert vote_locker.delegators(alice) == [bob, mikey]

def test_voting_powers_delegated_with_block_height(web3, accounts, chain, token, vote_locker):
    alice, bob, mikey = accounts[:3]
    votig_power_unit = amount // MAXTIME * (WEEK - 2 * H)
    votig_power_after_3_days = votig_power_unit - (amount // MAXTIME * (DAY * 3))

    assert approx(vote_locker.totalSupply(), votig_power_unit * 3, TOL)
    assert approx(vote_locker.balanceOf(alice), votig_power_unit, TOL)
    assert approx(vote_locker.balanceOf(mikey), votig_power_unit, TOL)
    assert approx(vote_locker.balanceOf(bob), votig_power_unit, TOL)
    vote_locker.delegate(mikey, {"from": bob})
    chain.mine()
    assert approx(vote_locker.totalSupplyAt(chain.height), votig_power_unit * 3, TOL)
    assert approx(vote_locker.balanceOf(mikey), votig_power_unit * 2, TOL)
    assert approx(vote_locker.balanceOf(bob), 0, TOL)
    block_number = chain.height
    chain.mine()

    chain.sleep(DAY * 3)
    vote_locker.delegate(ZERO_ADDRESS, {"from": bob})
    chain.mine()

    assert approx(vote_locker.balanceOf(mikey), votig_power_after_3_days, TOL)
    assert approx(vote_locker.balanceOf(bob), votig_power_after_3_days, TOL)
    assert approx(vote_locker.balanceOf(alice), votig_power_after_3_days, TOL)

    assert approx(vote_locker.balanceOfAt(bob, block_number), 0, TOL)

def test_fail_too_many_delegates(chain, accounts, vote_locker, token, web3):
    delegates = 9
    alice, bob, mikey = accounts[:3]
    vote_locker.delegate(alice, {"from": bob})
    vote_locker.delegate(alice, {"from": mikey})

    for curr_account in accounts[3:delegates]:
        alice.transfer(curr_account, "0.1 ether")
        token.transfer(curr_account, amount, {"from": alice})
        token.approve(vote_locker.address, amount * 10, {"from": curr_account})
        vote_locker.lockup(amount, chain[-1].timestamp + WEEK, {"from": curr_account})

    for curr_account in accounts[3:delegates - 1]:
        # make everyone delegate to alice
        vote_locker.delegate(alice, {"from": curr_account})

    with brownie.reverts("Maximum number of delegators reached. Call cleanUpWeakDelegators to remove low voting power delegators"):
        vote_locker.delegate(alice, {"from": accounts[delegates - 1]})

def test_delegation_gas_usage(governance, chain, accounts, vote_locker, token, timelock_controller, web3):
    alice, bob, mikey = accounts[:3]
    vote_locker.delegate(alice, {"from": bob})
    vote_locker.delegate(alice, {"from": mikey})

    for curr_account in accounts[3:7]:
        alice.transfer(curr_account, "0.1 ether")
        token.transfer(curr_account, amount, {"from": alice})
        token.approve(vote_locker.address, amount * 10, {"from": curr_account})
        vote_locker.lockup(amount, chain[-1].timestamp + WEEK, {"from": curr_account})
        # make everyone delegate to alice
        vote_locker.delegate(alice, {"from": curr_account})


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

    # Brownie calls debug_traceTransaction: https://github.com/eth-brownie/brownie/blob/3aecd87f47c9c316c85b0b0c6252ff7d900cca74/brownie/network/transaction.py#L634
    # Hardhat crashes because object to stringify is more that it can handle: https://capture.dropbox.com/MJ4QCk5aEH9ArF9x
    #
    # About gas cost. Seems that each delegate adds roughly ~50k gas to a cast vote. Which is 
    # larger than desirable.
    tx1 = governance.castVote(tx.return_value, 1, {"from": alice})

    assert tx1.gas_used < 600000


    