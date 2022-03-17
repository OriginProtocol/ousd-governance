import pytest
from ..helpers import approx
from ..fixtures import token, vote_locker, H, DAY, WEEK, MAXTIME, TOL, ZERO_ADDRESS
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

    vote_locker.delegate(ZERO_ADDRESS, {"from": alice})
    chain.mine()
    assert vote_locker.delegates(alice) == ZERO_ADDRESS
    assert vote_locker.delegators(bob) == [mikey]
    assert vote_locker.delegators(mikey) == []

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



    