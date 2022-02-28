import pytest
import brownie
import time
from brownie import OGV, VoteLockerCurve, accounts, chain
from .fixtures import token, vote_locker, now

def assert_within_percentage(a, b, percentage):
    assert abs(a - b) / a < percentage / 100

def test_cant_lockup_below_min(vote_locker, token):
    token.approve(vote_locker, 100e18)
    week = 86400 * 7
    next_week = int(chain.time() / week) * week + week
    with brownie.reverts("End must be at least {}".format(next_week)):
        vote_locker.upsertLockup(1, chain.time() + 100)

def test_cant_lockup_above_max(vote_locker, token, now):
    token.approve(vote_locker, 100e18)
    with brownie.reverts("End must be before maximum lockup time"):
        vote_locker.upsertLockup(1, now + 86400 * 365 * 5) # 5 years

def test_lockup(vote_locker, token):
    lock_amount = 100e18
    token.approve(vote_locker, lock_amount)
    one_year = 86400 * 365
    vote_locker.upsertLockup(lock_amount, chain.time() + one_year * 4) # 4 year lockup
    last_checkpoint = vote_locker.checkpoints(accounts[0], vote_locker.numCheckpoints(accounts[0]) - 1)
    # Lockup is close to max, voting power should be almost the locked up amount
    balance = vote_locker.balanceOf(accounts[0])
    assert_within_percentage(balance, lock_amount, 1)
    assert vote_locker.totalSupply() == balance
    chain.sleep(one_year * 3)
    chain.mine()
    # 3 years has elapsed in a four year lockup. 1/4 of the lockup amount should remain as voting power.
    # TODO 5% isn't very good
    balance = vote_locker.balanceOf(accounts[0])
    assert_within_percentage(balance, lock_amount / 4, 5)
    assert vote_locker.totalSupply() == balance
    chain.sleep(one_year)
    chain.mine()
    # Lockup has ended, voting power should be 0
    assert vote_locker.balanceOf(accounts[0]) == 0
    assert vote_locker.totalSupply() == 0

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
