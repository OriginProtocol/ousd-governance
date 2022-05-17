import brownie
from brownie import chain, accounts
from ..fixtures import token, staking, rewards

def test_cant_stake_above_max(staking, token):
    token.approve(staking, 100e18)
    with brownie.reverts("Staking: Too long"):
        staking.stake(1, chain.time() + 86400 * 365 * 5, accounts.default) # 5 years

def test_cant_stake_zero_tokens(staking, token):
    with brownie.reverts("Staking: Not enough"):
        staking.stake(0, chain.time() + 86400 * 365, accounts.default)

