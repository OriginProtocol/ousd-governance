# Copied from https://github.com/curvefi/curve-dao-contracts/blob/master/tests/integration/VotingEscrow/test_voting_escrow.py
import pytest
from ..helpers import approx, H, DAY, WEEK, MAXTIME, TOL
from ..fixtures import token, vote_locker

@pytest.fixture(autouse=True)
def isolation(fn_isolation):
    pass

def test_voting_powers(web3, chain, accounts, token, vote_locker):
    """
    Test voting power in the following scenario.
    Alice:
    ~~~~~~~
    ^
    | *       *
    | | \     |  \
    | |  \    |    \
    +-+---+---+------+---> t

    Bob:
    ~~~~~~~
    ^
    |         *
    |         | \
    |         |  \
    +-+---+---+---+--+---> t

    Alice has 100% of voting power in the first period.
    She has 2/3 power at the start of 2nd period, with Bob having 1/2 power
    (due to smaller locktime).
    Alice's power grows to 100% by Bob's unlock.

    Checking that totalSupply is appropriate.

    After the test is done, check all over again with balanceOfAt / totalSupplyAt
    """
    alice, bob = accounts[:2]
    amount = 1000 * 10 ** 18
    token.transfer(bob, amount, {"from": alice})
    stages = {}

    token.approve(vote_locker.address, amount * 10, {"from": alice})
    token.approve(vote_locker.address, amount * 10, {"from": bob})

    assert vote_locker.totalSupply() == 0
    assert vote_locker.balanceOf(alice) == 0
    assert vote_locker.balanceOf(bob) == 0

    # Move to timing which is good for testing - beginning of a UTC week
    chain.sleep((chain[-1].timestamp // WEEK + 1) * WEEK - chain[-1].timestamp)
    chain.mine()

    chain.sleep(H)

    stages["before_deposits"] = (web3.eth.block_number, chain[-1].timestamp)

    vote_locker.lockup(amount, chain[-1].timestamp + WEEK, {"from": alice})

    stages["alice_deposit"] = (web3.eth.block_number, chain[-1].timestamp)

    chain.sleep(H)
    chain.mine()

    assert approx(vote_locker.totalSupply(), amount // MAXTIME * (WEEK - 2 * H), TOL)
    assert approx(vote_locker.balanceOf(alice), amount // MAXTIME * (WEEK - 2 * H), TOL)
    assert vote_locker.balanceOf(bob) == 0
    t0 = chain[-1].timestamp

    stages["alice_in_0"] = []
    stages["alice_in_0"].append((web3.eth.block_number, chain[-1].timestamp))
    for i in range(7):
        for _ in range(24):
            chain.sleep(H)
            chain.mine()
        dt = chain[-1].timestamp - t0
        assert approx(
            vote_locker.totalSupply(),
            amount // MAXTIME * max(WEEK - 2 * H - dt, 0),
            TOL,
        )
        assert approx(
            vote_locker.balanceOf(alice),
            amount // MAXTIME * max(WEEK - 2 * H - dt, 0),
            TOL,
        )
        assert vote_locker.balanceOf(bob) == 0
        stages["alice_in_0"].append((web3.eth.block_number, chain[-1].timestamp))

    chain.sleep(H)

    assert vote_locker.balanceOf(alice) == 0

    vote_locker.withdraw({"from": alice})

    stages["alice_withdraw"] = (web3.eth.block_number, chain[-1].timestamp)
    assert vote_locker.totalSupply() == 0
    assert vote_locker.balanceOf(alice) == 0
    assert vote_locker.balanceOf(bob) == 0

    chain.sleep(H)
    chain.mine()

    # Next week (for round counting)
    chain.sleep((chain[-1].timestamp // WEEK + 1) * WEEK - chain[-1].timestamp)
    chain.mine()

    vote_locker.lockup(amount, chain[-1].timestamp + 2 * WEEK, {"from": alice})

    stages["alice_deposit_2"] = (web3.eth.block_number, chain[-1].timestamp)

    assert approx(vote_locker.totalSupply(), amount // MAXTIME * 2 * WEEK, TOL)
    assert approx(vote_locker.balanceOf(alice), amount // MAXTIME * 2 * WEEK, TOL)
    assert vote_locker.balanceOf(bob) == 0

    vote_locker.lockup(amount, chain[-1].timestamp + WEEK, {"from": bob})

    stages["bob_deposit_2"] = (web3.eth.block_number, chain[-1].timestamp)

    assert approx(vote_locker.balanceOf(alice), amount // MAXTIME * 2 * WEEK, TOL)
    assert approx(vote_locker.balanceOf(bob), amount // MAXTIME * WEEK, TOL)
    assert approx(vote_locker.totalSupply(), amount // MAXTIME * 3 * WEEK, TOL)

    t0 = chain[-1].timestamp
    chain.sleep(H)
    chain.mine()

    stages["alice_bob_in_2"] = []
    # Beginning of week: weight 3
    # End of week: weight 1
    for i in range(7):
        for _ in range(24):
            chain.sleep(H)
            chain.mine()
        dt = chain[-1].timestamp - t0
        w_total = vote_locker.totalSupply()
        w_alice = vote_locker.balanceOf(alice)
        w_bob = vote_locker.balanceOf(bob)
        assert w_total == w_alice + w_bob
        assert approx(w_alice, amount // MAXTIME * max(2 * WEEK - dt, 0), TOL)
        assert approx(w_bob, amount // MAXTIME * max(WEEK - dt, 0), TOL)
        stages["alice_bob_in_2"].append((web3.eth.block_number, chain[-1].timestamp))


    chain.sleep(H)
    chain.mine()

    vote_locker.withdraw({ "from": bob })
    t0 = chain[-1].timestamp
    stages["bob_withdraw_1"] = (web3.eth.block_number, chain[-1].timestamp)
    w_total = vote_locker.totalSupply()
    w_alice = vote_locker.balanceOf(alice)
    assert w_alice == w_total
    assert approx(w_total, amount // MAXTIME * (WEEK - 2 * H), TOL)
    assert vote_locker.balanceOf(bob) == 0

    chain.sleep(H)
    chain.mine()

    stages["alice_in_2"] = []
    for i in range(7):
        for _ in range(24):
            chain.sleep(H)
            chain.mine()
        dt = chain[-1].timestamp - t0
        w_total = vote_locker.totalSupply()
        w_alice = vote_locker.balanceOf(alice)
        assert w_total == w_alice
        assert approx(w_total, amount // MAXTIME * max(WEEK - dt - 2 * H, 0), TOL)
        assert vote_locker.balanceOf(bob) == 0
        stages["alice_in_2"].append((web3.eth.block_number, chain[-1].timestamp))

    vote_locker.withdraw({"from": alice})
    stages["alice_withdraw_2"] = (web3.eth.block_number, chain[-1].timestamp)

    chain.sleep(H)
    chain.mine()

    # vote_locker.withdraw({"from": bob})
    stages["bob_withdraw_2"] = (web3.eth.block_number, chain[-1].timestamp)

    assert vote_locker.totalSupply() == 0
    assert vote_locker.balanceOf(alice) == 0
    assert vote_locker.balanceOf(bob) == 0

    # Now test historical balanceOfAt and others

    assert vote_locker.balanceOfAt(alice, stages["before_deposits"][0]) == 0
    assert vote_locker.balanceOfAt(bob, stages["before_deposits"][0]) == 0
    assert vote_locker.totalSupplyAt(stages["before_deposits"][0]) == 0

    w_alice = vote_locker.balanceOfAt(alice, stages["alice_deposit"][0])
    assert approx(w_alice, amount // MAXTIME * (WEEK - H), TOL)
    assert vote_locker.balanceOfAt(bob, stages["alice_deposit"][0]) == 0
    w_total = vote_locker.totalSupplyAt(stages["alice_deposit"][0])
    assert w_alice == w_total
    for i, (block, t) in enumerate(stages["alice_in_0"]):
        w_alice = vote_locker.balanceOfAt(alice, block)
        w_bob = vote_locker.balanceOfAt(bob, block)
        w_total = vote_locker.totalSupplyAt(block)
        assert w_bob == 0
        assert w_alice == w_total
        time_left = WEEK * (7 - i) // 7 - 2 * H
        error_1h = H / time_left  # Rounding error of 1 block is possible, and we have 1h blocks
        assert approx(w_alice, amount // MAXTIME * time_left, error_1h)

    w_total = vote_locker.totalSupplyAt(stages["alice_withdraw"][0])
    w_alice = vote_locker.balanceOfAt(alice, stages["alice_withdraw"][0])
    w_bob = vote_locker.balanceOfAt(bob, stages["alice_withdraw"][0])
    assert w_alice == w_bob == w_total == 0

    w_total = vote_locker.totalSupplyAt(stages["alice_deposit_2"][0])
    w_alice = vote_locker.balanceOfAt(alice, stages["alice_deposit_2"][0])
    w_bob = vote_locker.balanceOfAt(bob, stages["alice_deposit_2"][0])
    assert approx(w_total, amount // MAXTIME * 2 * WEEK, TOL)
    assert w_total == w_alice
    assert w_bob == 0

    w_total = vote_locker.totalSupplyAt(stages["bob_deposit_2"][0])
    w_alice = vote_locker.balanceOfAt(alice, stages["bob_deposit_2"][0])
    w_bob = vote_locker.balanceOfAt(bob, stages["bob_deposit_2"][0])
    assert approx(w_total, w_alice + w_bob, TOL)
    assert approx(w_total, amount // MAXTIME * 3 * WEEK, TOL)
    assert approx(w_alice, amount // MAXTIME * 2 * WEEK, TOL)

    t0 = stages["bob_deposit_2"][1]
    for i, (block, t) in enumerate(stages["alice_bob_in_2"]):
        w_alice = vote_locker.balanceOfAt(alice, block)
        w_bob = vote_locker.balanceOfAt(bob, block)
        w_total = vote_locker.totalSupplyAt(block)
        assert approx(w_total, w_alice + w_bob, TOL)
        dt = t - t0
        error_1h = H / (
            2 * WEEK - i * DAY
        )  # Rounding error of 1 block is possible, and we have 1h blocks
        assert approx(w_alice, amount // MAXTIME * max(2 * WEEK - dt, 0), error_1h)
        assert approx(w_bob, amount // MAXTIME * max(WEEK - dt, 0), error_1h)

    w_total = vote_locker.totalSupplyAt(stages["bob_withdraw_1"][0])
    w_alice = vote_locker.balanceOfAt(alice, stages["bob_withdraw_1"][0])
    w_bob = vote_locker.balanceOfAt(bob, stages["bob_withdraw_1"][0])
    assert approx(w_total, w_alice, TOL)
    assert approx(w_total, amount // MAXTIME * (WEEK - 2 * H), TOL)
    assert w_bob == 0

    t0 = stages["bob_withdraw_1"][1]
    for i, (block, t) in enumerate(stages["alice_in_2"]):
        w_alice = vote_locker.balanceOfAt(alice, block)
        w_bob = vote_locker.balanceOfAt(bob, block)
        w_total = vote_locker.totalSupplyAt(block)
        assert approx(w_total, w_alice, TOL)
        assert w_bob == 0
        dt = t - t0
        error_1h = H / (
            WEEK - i * DAY + DAY
        )  # Rounding error of 1 block is possible, and we have 1h blocks
        assert approx(w_total, amount // MAXTIME * max(WEEK - dt - 2 * H, 0), error_1h)

    w_total = vote_locker.totalSupplyAt(stages["bob_withdraw_2"][0])
    w_alice = vote_locker.balanceOfAt(alice, stages["bob_withdraw_2"][0])
    w_bob = vote_locker.balanceOfAt(bob, stages["bob_withdraw_2"][0])
    assert w_total == w_alice == w_bob == 0
