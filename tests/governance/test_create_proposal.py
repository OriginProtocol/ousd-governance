from brownie import accounts

from ..fixtures import governance, timelock_controller, token, vote_locker

def test_create_proposal(governance):
    tx = governance.propose(
        [
            "0xEA2Ef2e2E5A749D4A66b41Db9aD85a38Aa264cb3",
            "0xEA2Ef2e2E5A749D4A66b41Db9aD85a38Aa264cb3",
            "0xEA2Ef2e2E5A749D4A66b41Db9aD85a38Aa264cb3"
        ],
        [0, 0, 0],
        [
            "upgradeTo(address)",
            "setRewardTokenAddress(address)",
            "setCvxRewardTokenAddress(address)"
        ],
        [
            0x00000000000000000000000016156a06bd1bd2d80134ea1ee7e5faebdbfa20aa,
            0x000000000000000000000000d533a949740bb3306d119cc777fa900ba034cd52,
            0x0000000000000000000000004e3fbd56cd56c3e72c1403e103b45db9da5b9d2b
        ],
        "Switch to new Convex implementation"
    , {'from': accounts[0]})

    id = tx.return_value
