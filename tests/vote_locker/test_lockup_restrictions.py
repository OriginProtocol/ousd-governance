import brownie
from ..fixtures import token, vote_locker, now

def test_cant_lockup_above_max(vote_locker, token, now):
    token.approve(vote_locker, 100e18)
    with brownie.reverts("End must be before maximum lockup time"):
        vote_locker.upsertLockup(1, now + 86400 * 365 * 5) # 5 years
