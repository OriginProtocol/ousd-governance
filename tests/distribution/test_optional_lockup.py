from brownie import *
from ..helpers import approx, H, MAXTIME, WEEK
from ..fixtures import optional_lockup_distributor, token, staking, rewards

merkle_proof = [
    0xC06E0D1A35007D9401AB64B2EDB9CD0A674EBCCE35ACBF4C93E1193F99DF35D3,
    0xA7856630EACDC74C4F5891E97AB7DA00642F08CBEA4D7DE72AC28C18FAFE01D3,
    0xCB8BD9CA540F4B1C63F13D7DDFEC54AB24715F49F9A3640C1CCF9F548A896554,
]


def test_no_lockup_duration(optional_lockup_distributor, token):
    amount = 0x019D971E4FE8401E74000000
    before_balance = token.balanceOf(accounts.default)
    # Transfer to the distributor contract so it has something to give out
    token.transfer(optional_lockup_distributor.address, amount)
    optional_lockup_distributor.claim(1, amount, merkle_proof, 0)
    # Should have got amount transferred to the contract straight back
    assert token.balanceOf(accounts.default) == before_balance


def test_claim_with_lockup_duration(optional_lockup_distributor, token, staking):
    amount = 0x019D971E4FE8401E74000000
    # Transfer to the distributor contract so it has something to give out
    token.transfer(optional_lockup_distributor.address, amount)
    optional_lockup_distributor.claim(1, amount, merkle_proof, WEEK)
    chain.sleep(WEEK)
    chain.mine()
    assert staking.lockups(accounts.default, 0)[0] == amount
