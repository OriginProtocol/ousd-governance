from .fixtures import token, vote_locker

def test_name(vote_locker):
    assert vote_locker.name() == "Vote Locked Origin Governance Token"

def test_symbol(vote_locker):
    assert vote_locker.symbol() == "vlOGV"

def test_decimals(vote_locker):
    assert vote_locker.decimals() == 18

def test_initial_total_supply(vote_locker):
    assert vote_locker.totalSupply() == 0

def test_initial_total_supply_at(vote_locker):
    pass

def test_total_supply_at_future_block_fails(vote_locker):
    pass

def test_initial_balances(vote_locker):
    pass

def test_initial_balance_at(vote_locker):
    pass

def  test_balance_at_future_block_fails(vote_locker):
    pass
