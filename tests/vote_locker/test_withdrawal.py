import brownie
from brownie import accounts, chain
from ..helpers import mine_blocks, floor_week

from ..fixtures import governance, timelock_controller, token, vote_locker

def test_cant_withdraw_before_lockup_end(vote_locker, token, web3):
    lock_amount = 100e18
    token.approve(vote_locker, lock_amount)
    lockup_end = floor_week(chain.time() + 86400 * 365) # 1 year lockup
    vote_locker.lockup(lock_amount, lockup_end)
    with brownie.reverts("Lockup must be expired"):
        vote_locker.withdraw()

def test_can_withdraw_after_lockup_end(vote_locker, token, web3):
    lock_amount = 100e18
    token.approve(vote_locker, lock_amount)
    lockup_end = floor_week(chain.time() + 86400 * 365) # 1 year lockup
    vote_locker.lockup(lock_amount, lockup_end)
    # Mine 1 years worth of blocks, 2102400 blocks with 15 seconds block time
    mine_blocks(web3, amount="0x201480", interval="0xf")
    balance_before = token.balanceOf(accounts.default)
    vote_locker.withdraw()
    balance_after = token.balanceOf(accounts.default)
    assert(balance_after - balance_before == lock_amount)
