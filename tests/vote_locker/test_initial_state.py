import brownie
from brownie import accounts
from ..fixtures import token, vote_locker

def test_name(vote_locker):
    assert vote_locker.name() == "Vote Escrowed Origin Dollar Governance"

def test_symbol(vote_locker):
    assert vote_locker.symbol() == "veOGV"

def test_decimals(vote_locker):
    assert vote_locker.decimals() == 18

def test_initial_total_supply(vote_locker):
    assert vote_locker.totalSupply() == 0

def test_initial_total_supply_at(web3, vote_locker):
    assert vote_locker.totalSupplyAt(web3.eth.block_number) == 0

def test_total_supply_at_future_block_fails(web3, vote_locker):
    with brownie.reverts("Block number is in the future"):
        assert vote_locker.totalSupplyAt(web3.eth.block_number + 1) == 0

def test_initial_balances(web3, vote_locker):
    for i in range(0, 10):
        assert vote_locker.balanceOfAt(accounts[i], web3.eth.block_number) == 0

def test_initial_balance_at(web3, vote_locker):
    assert vote_locker.balanceOfAt(accounts[0], web3.eth.block_number) == 0

def test_balance_at_future_block_fails(web3, vote_locker):
    with brownie.reverts("Block number is in the future"):
        assert vote_locker.balanceOfAt(accounts[0], web3.eth.block_number + 1)

def test_can_set_staking_token(web3, vote_locker, token):
    vote_locker.setStakingToken(vote_locker.address)
    assert vote_locker.name() == "Vote Escrowed Vote Escrowed Origin Dollar Governance"
    assert vote_locker.symbol() == "veveOGV"
    assert vote_locker.decimals() == 18

def test_non_owner_cant_set_staking_token(web3, vote_locker, token):
    with brownie.reverts("Ownable: caller is not the owner"):
        vote_locker.setStakingToken(token.address, {"from": accounts[1]})
