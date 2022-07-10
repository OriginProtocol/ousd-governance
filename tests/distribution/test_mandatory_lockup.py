from brownie import *
import brownie
from ..helpers import WEEK, DAY
from ..fixtures import mandatory_lockup_distributor, token, rewards, staking

merkle_proof = [
    0xC06E0D1A35007D9401AB64B2EDB9CD0A674EBCCE35ACBF4C93E1193F99DF35D3,
    0xA7856630EACDC74C4F5891E97AB7DA00642F08CBEA4D7DE72AC28C18FAFE01D3,
    0xCB8BD9CA540F4B1C63F13D7DDFEC54AB24715F49F9A3640C1CCF9F548A896554,
]


def test_claim(mandatory_lockup_distributor, token, staking):
    amount = 500000000 * 1e18
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
    assert lockup_one[1] == tx.timestamp + 12 * 2629800
    assert lockup_two[0] == amount / 4
    assert lockup_two[1] == tx.timestamp + 24 * 2629800
    assert lockup_three[0] == amount / 4
    assert lockup_three[1] == tx.timestamp + 36 * 2629800
    assert lockup_four[0] == amount / 4
    assert lockup_four[1] == tx.timestamp + 48 * 2629800


def test_can_not_claim(mandatory_lockup_distributor, token):
    amount = 500000000 * 1e18

    # Transfer to the distributor contract so it has something to lockup
    token.transfer(mandatory_lockup_distributor.address, amount)
    chain.mine(100)
    with brownie.reverts("Can no longer claim. Claim period expired"):
        mandatory_lockup_distributor.claim(1, amount, merkle_proof)


def test_burn_remaining_amount(mandatory_lockup_distributor, token):
    amount = 500000000 * 1e18
    # Transfer to the distributor contract so it has something to give out
    token.transfer(mandatory_lockup_distributor.address, amount)
    chain.sleep(WEEK)
    # end block is set to 100 blocks after current fixture block
    chain.mine(100)
    mandatory_lockup_distributor.burnRemainingOGV()
    assert token.balanceOf(mandatory_lockup_distributor) == 0


def test_can_not_burn_remaining_amount(mandatory_lockup_distributor, token):
    amount = 500000000 * 1e18
    # Transfer to the distributor contract so it has something to give out
    token.transfer(mandatory_lockup_distributor.address, amount)
    chain.sleep(WEEK)
    # end block is set to 100 blocks after current fixture block
    chain.mine(96)
    with brownie.reverts("Can not yet burn the remaining OGV"):
        mandatory_lockup_distributor.burnRemainingOGV()


def test_valid_proof(mandatory_lockup_distributor, token):
    amount = 500000000 * 1e18
    # Transfer to the distributor contract so it has something to lockup
    token.transfer(mandatory_lockup_distributor.address, amount)
    assert mandatory_lockup_distributor.isProofValid(
        1, amount, accounts.default, merkle_proof
    )


def test_invalid_proof(mandatory_lockup_distributor, token):
    amount = 500000000 * 1e18
    # Transfer to the distributor contract so it has something to lockup
    token.transfer(mandatory_lockup_distributor.address, amount)
    false_merkle_proof = merkle_proof
    false_merkle_proof[
        0
    ] = "0xC06E0D1A35007D9401AB64B2EDB9CD0A674EBCCE35ACBF4C93E1193F99DF35D2"
    assert not mandatory_lockup_distributor.isProofValid(
        1, amount, accounts.default, false_merkle_proof
    )


def test_cannot_claim_with_invalid_proof(mandatory_lockup_distributor, token):
    amount = 500000000 * 1e18
    # Transfer to the distributor contract so it has something to lockup
    token.transfer(mandatory_lockup_distributor.address, amount)
    false_merkle_proof = merkle_proof
    false_merkle_proof[
        0
    ] = "0xC06E0D1A35007D9401AB64B2EDB9CD0A674EBCCE35ACBF4C93E1193F99DF35D2"
    with brownie.reverts("MerkleDistributor: Invalid proof."):
        mandatory_lockup_distributor.claim(1, amount, merkle_proof)
