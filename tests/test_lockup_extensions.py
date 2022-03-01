import brownie
from brownie import OGV, VoteLockerCurve, accounts, chain

from ..fixtures import token, vote_locker, now

def test_extend_lockup_expiry(vote_locker, token):
    lock_amount = 100e18
    token.approve(vote_locker, 100e18)
    vote_locker.upsertLockup(lock_amount, 86400 * 365) # 1 year lockup
    vote_locker.upsertLockup(lock_amount, 86400 * 365 * 4) # 4 year lockup
    boosted_amount = lock_amount + lock_amount * 4
    assert vote_locker.balanceOf(accounts[0]) == boosted_amount
    assert vote_locker.totalSupply() == boosted_amount

def test_increase_lockup_amount(vote_locker, token):
    lock_amount = 200e18
    token.approve(vote_locker, lock_amount)
    vote_locker.upsertLockup(lock_amount, 86400 * 365) # 1 year lockup
    vote_locker.upsertLockup(lock_amount * 2, 86400 * 365) # 1 year lockup
