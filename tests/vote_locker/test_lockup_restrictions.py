import brownie
from brownie import chain
from ..fixtures import token, vote_locker

def test_cant_lockup_above_max(vote_locker, token):
    token.approve(vote_locker, 100e18)
    with brownie.reverts("End must be before maximum lockup time"):
        vote_locker.lockup(1, chain.time() + 86400 * 365 * 5) # 5 years

def test_cant_lockup_zero_tokens(vote_locker, token):
    with brownie.reverts("Amount must be greater than 0"):
        vote_locker.lockup(0, chain.time() + 86400 * 365)
