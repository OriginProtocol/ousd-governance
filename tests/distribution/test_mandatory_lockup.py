from brownie import *
from ..helpers import approx, H, MAXTIME, WEEK
from ..fixtures import mandatory_lockup_distributor, token, staking, rewards

merkle_proof = [
    0xC06E0D1A35007D9401AB64B2EDB9CD0A674EBCCE35ACBF4C93E1193F99DF35D3,
    0xA7856630EACDC74C4F5891E97AB7DA00642F08CBEA4D7DE72AC28C18FAFE01D3,
    0xCB8BD9CA540F4B1C63F13D7DDFEC54AB24715F49F9A3640C1CCF9F548A896554,
]


def test_claim(mandatory_lockup_distributor, token, staking):
    amount = 0x019D971E4FE8401E74000000
    # Transfer to the distributor contract so it has something to lockup
    token.transfer(mandatory_lockup_distributor.address, amount)
    tx = mandatory_lockup_distributor.claim(1, amount, merkle_proof)
    chain.sleep(WEEK)
    chain.mine()
    lockup_one = staking.lockups(accounts.default, 0)
    lockup_two = staking.lockups(accounts.default, 1)
    lockup_three = staking.lockups(accounts.default, 2)
    lockup_four = staking.lockups(accounts.default, 3)
    assert lockup_one[0] == amount / 4
    assert lockup_one[1] == tx.timestamp + 52 * WEEK
    assert lockup_two[0] == amount / 4
    assert lockup_two[1] == tx.timestamp + 104 * WEEK
    assert lockup_three[0] == amount / 4
    assert lockup_three[1] == tx.timestamp + 156 * WEEK
    assert lockup_four[0] == amount / 4
    assert lockup_four[1] == tx.timestamp + 208 * WEEK
