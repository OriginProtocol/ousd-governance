from brownie import *
from ..helpers import approx, H, MAXTIME, TOL, WEEK
from ..fixtures import mandatory_lockup_distributor, token, staking, rewards

merkle_proof = [
    0xc06e0d1a35007d9401ab64b2edb9cd0a674ebcce35acbf4c93e1193f99df35d3,
    0xa7856630eacdc74c4f5891e97ab7da00642f08cbea4d7de72ac28c18fafe01d3,
    0xcb8bd9ca540f4b1c63f13d7ddfec54ab24715f49f9a3640c1ccf9f548a896554
]

def test_claim(mandatory_lockup_distributor, token, staking):
    amount = 0x019d971e4fe8401e74000000
    # Transfer to the distributor contract so it has something to lockup
    token.transfer(mandatory_lockup_distributor.address, amount)
    tx = mandatory_lockup_distributor.claim(1, amount, merkle_proof)
    chain.sleep(WEEK)
    chain.mine()
    lockup_one = staking.lockups(accounts.default, 0)
    lockup_two = staking.lockups(accounts.default, 1)
    lockup_three = staking.lockups(accounts.default, 2)
    lockup_four = staking.lockups(accounts.default, 3)
    assert(lockup_one[0] == amount / 4)
    assert(lockup_one[1] == tx.timestamp + 52 * WEEK)
    assert(lockup_two[0] == amount / 4)
    assert(lockup_two[1] == tx.timestamp + 104 * WEEK)
    assert(lockup_three[0] == amount / 4)
    assert(lockup_three[1] == tx.timestamp + 156 * WEEK)
    assert(lockup_four[0] == amount / 4)
    assert(lockup_four[1] == tx.timestamp + 208 * WEEK)
