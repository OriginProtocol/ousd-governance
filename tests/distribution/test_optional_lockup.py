from brownie import *
import brownie
from ..helpers import approx, H, MAXTIME, WEEK
from ..fixtures import (
    optional_lockup_distributor,
    token,
    staking,
    rewards,
    show_transfers,
)

merkle_proof = [
    0xC06E0D1A35007D9401AB64B2EDB9CD0A674EBCCE35ACBF4C93E1193F99DF35D3,
    0xA7856630EACDC74C4F5891E97AB7DA00642F08CBEA4D7DE72AC28C18FAFE01D3,
    0xCB8BD9CA540F4B1C63F13D7DDFEC54AB24715F49F9A3640C1CCF9F548A896554,
]


def test_no_lockup_duration(optional_lockup_distributor, token):
    amount = 500000000 * 1e18
    # Transfer to the distributor contract so it has something to give out
    token.transfer(optional_lockup_distributor.address, amount)
    before_balance = token.balanceOf(accounts.default)
    tx = optional_lockup_distributor.claim(1, amount, merkle_proof, 0)
    # Should have gotten amount transferred back to the contract.
    assert token.balanceOf(accounts.default) == before_balance + amount


def test_claim_with_lockup_duration(optional_lockup_distributor, token, staking):
    amount = 500000000 * 1e18
    # Transfer to the distributor contract so it has something to give out
    token.transfer(optional_lockup_distributor.address, amount)
    optional_lockup_distributor.claim(1, amount, merkle_proof, WEEK)
    assert staking.lockups(accounts.default, 0)[0] == amount


def test_can_not_claim(optional_lockup_distributor, token, staking):
    amount = 500000000 * 1e18
    # Transfer to the distributor contract so it has something to give out
    token.transfer(optional_lockup_distributor.address, amount)
    chain.mine(100)
    with brownie.reverts("Can no longer claim. Claim period expired"):
        optional_lockup_distributor.claim(1, amount, merkle_proof, WEEK)


def test_burn_remaining_amount(optional_lockup_distributor, token, staking):
    amount = 500000000 * 1e18
    # Transfer to the distributor contract so it has something to give out
    token.transfer(optional_lockup_distributor.address, amount)
    before_balance = token.balanceOf(accounts.default)
    chain.sleep(WEEK)
    # end block is set to 100 blocks after current fixture block
    chain.mine(100)
    optional_lockup_distributor.burnRemainingOGV()
    assert token.balanceOf(optional_lockup_distributor) == 0


def test_can_not_burn_remaining_amount(optional_lockup_distributor, token, staking):
    amount = 500000000 * 1e18
    # Transfer to the distributor contract so it has something to give out
    token.transfer(optional_lockup_distributor.address, amount)
    before_balance = token.balanceOf(accounts.default)
    chain.sleep(WEEK)
    # end block is set to 100 blocks after current fixture block
    chain.mine(96)
    with brownie.reverts("Can not yet burn the remaining OGV"):
        optional_lockup_distributor.burnRemainingOGV()


def test_valid_proof(optional_lockup_distributor, token, staking):
    amount = 500000000 * 1e18
    # Transfer to the distributor contract so it has something to lockup
    token.transfer(optional_lockup_distributor.address, amount)
    assert optional_lockup_distributor.isProofValid(1, amount, merkle_proof)


def test_invalid_proof(optional_lockup_distributor, token, staking):
    amount = 500000000 * 1e18
    # Transfer to the distributor contract so it has something to lockup
    token.transfer(optional_lockup_distributor.address, amount)
    false_merkle_proof = merkle_proof
    false_merkle_proof[
        0
    ] = "0xC06E0D1A35007D9401AB64B2EDB9CD0A674EBCCE35ACBF4C93E1193F99DF35D2"
    assert not optional_lockup_distributor.isProofValid(
        1, amount, false_merkle_proof)
