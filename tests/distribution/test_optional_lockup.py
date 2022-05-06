import brownie
from brownie import *
from ..fixtures import optional_lockup_distributor, token, vote_locker


def test_no_lockup_duration(token, optional_lockup_distributor):
    amount = "0x019d971e4fe8401e74000000"
    before_balance = token.balanceOf(accounts.default)
    # Transfer to the distributor contract so it has something to give out
    token.transfer(optional_lockup_distributor.address, amount)
    merkle_proof = [
        0xc06e0d1a35007d9401ab64b2edb9cd0a674ebcce35acbf4c93e1193f99df35d3,
        0xa7856630eacdc74c4f5891e97ab7da00642f08cbea4d7de72ac28c18fafe01d3,
        0xcb8bd9ca540f4b1c63f13d7ddfec54ab24715f49f9a3640c1ccf9f548a896554
    ]
    optional_lockup_distributor.claim(1, amount, merkle_proof, 0)
    # Should have got amount transferred to the contract straight back
    assert token.balanceOf(accounts.default) == before_balance


def test_claim_with_lockup_duration(optional_lockup_distributor):
    pass
