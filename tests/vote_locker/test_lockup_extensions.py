import brownie
from brownie import accounts, chain

from ..helpers import floor_week
from ..fixtures import token, vote_locker

def test_extend_lockup_expiry(vote_locker, token):
    lock_amount = 100e18
    token.approve(vote_locker, lock_amount)
    initial_lockup_end = floor_week(chain.time() + 86400 * 365) # 1 year lockup
    vote_locker.lockup(lock_amount, initial_lockup_end)
    assert(vote_locker.getLockup(accounts[0])[0] == lock_amount)
    assert(vote_locker.getLockup(accounts[0])[1] == initial_lockup_end)
    next_lockup_end = floor_week(chain.time() + 86400 * 365 * 4) # 4 year lockup
    vote_locker.lockup(lock_amount, next_lockup_end)
    assert(vote_locker.getLockup(accounts[0])[0] == lock_amount)
    assert(vote_locker.getLockup(accounts[0])[1] == next_lockup_end)


def test_cant_decrease_lockup_expiry(vote_locker, token):
    lock_amount = 100e18
    token.approve(vote_locker, lock_amount)
    lockup_end = floor_week(chain.time() + 86400 * 365) # 1 year lockup
    vote_locker.lockup(lock_amount, lockup_end) # 1 year lockup
    with brownie.reverts("End must be greater than or equal to the current end"):
        vote_locker.lockup(lock_amount - 1, lockup_end - 1) # 1 year lockupa


def test_increase_lockup_amount(vote_locker, token):
    lock_amount = 100e18
    token.approve(vote_locker, lock_amount * 2)
    lockup_end = floor_week(chain.time() + 86400 * 365) # 1 year lockup
    vote_locker.lockup(lock_amount, lockup_end) # 1 year lockup
    assert(vote_locker.getLockup(accounts[0])[0] == lock_amount)
    assert(vote_locker.getLockup(accounts[0])[1] == lockup_end)
    vote_locker.lockup(lock_amount * 2, lockup_end) # 1 year lockup
    assert(vote_locker.getLockup(accounts[0])[0] == lock_amount * 2)
    assert(vote_locker.getLockup(accounts[0])[1] == lockup_end)


def test_cant_decrease_lockup_amount(vote_locker, token):
    lock_amount = 100e18
    token.approve(vote_locker, lock_amount)
    lockup_end = floor_week(chain.time() + 86400 * 365) # 1 year lockup
    vote_locker.lockup(lock_amount, lockup_end) # 1 year lockup
    with brownie.reverts("Amount must be greater than or equal to current amount"):
        vote_locker.lockup(99e18, lockup_end) # 1 year lockup

