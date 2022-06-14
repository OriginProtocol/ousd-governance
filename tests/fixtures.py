import pytest
from brownie import *
from .helpers import DAY

test_merkle_data = {
    "merkle_root": "0x362525d914142d116c518263e481c6cbe968a44638f9faeffb01c11a84008b96",
    "token_total": "0x0813f3978f89409844000000",
    "claims": {
        "0x4370823e0453BAe9F6B6b790daA7D02Fd158719f": {
            "index": 0,
            "amount": "0x019d971e4fe8401e74000000",
            "proof": [
                "0x701183f5e8c42cecd237685c83e965d69a618d1380bc159998b2dc1ed2f550fd",
                "0x6829150a3b7e2535bd9cce778cf05ead15bd6f3cc5bb39a9dc4d756a0a64ece7",
                "0xcb8bd9ca540f4b1c63f13d7ddfec54ab24715f49f9a3640c1ccf9f548a896554",
            ],
        },
        "0x8dea6Ef7767e0D6ae7Dd9D144E514D7DFAe75B36": {
            "index": 1,
            "amount": "0x019d971e4fe8401e74000000",
            "proof": [
                "0xc06e0d1a35007d9401ab64b2edb9cd0a674ebcce35acbf4c93e1193f99df35d3",
                "0xa7856630eacdc74c4f5891e97ab7da00642f08cbea4d7de72ac28c18fafe01d3",
                "0xcb8bd9ca540f4b1c63f13d7ddfec54ab24715f49f9a3640c1ccf9f548a896554",
            ],
        },
        "0xE8F8B89D408C236f3FbA18898eAd345070252abA": {
            "index": 2,
            "amount": "0x019d971e4fe8401e74000000",
            "proof": [
                "0xab335d7d89102b2079834202d020e69982db42f074920e742d4841e7e3bd6255",
                "0xa7856630eacdc74c4f5891e97ab7da00642f08cbea4d7de72ac28c18fafe01d3",
                "0xcb8bd9ca540f4b1c63f13d7ddfec54ab24715f49f9a3640c1ccf9f548a896554",
            ],
        },
        "0xc6A45cdD6892039FcDB0bbf3867eF33ba46F90c5": {
            "index": 3,
            "amount": "0x019d971e4fe8401e74000000",
            "proof": [
                "0x3afd4908f772f66e5085cdc6d8e90d755db208b6bdad5ced4650046aadb3e7c2",
                "0x6829150a3b7e2535bd9cce778cf05ead15bd6f3cc5bb39a9dc4d756a0a64ece7",
                "0xcb8bd9ca540f4b1c63f13d7ddfec54ab24715f49f9a3640c1ccf9f548a896554",
            ],
        },
        "0xdfae2c5962514417f805776a7f280F5084a0f06C": {
            "index": 4,
            "amount": "0x019d971e4fe8401e74000000",
            "proof": [
                "0x710ba1b8e900d3f58896f4429e3a384faa1a5aa2a02d33b838d39ec7f7075601"
            ],
        },
    },
}


@pytest.fixture
def token():
    accounts.default = accounts[0]
    return run("deploy_token")


@pytest.fixture
def rewards(token):
    return run("deploy_rewards", "main", (token.address,))


@pytest.fixture
def staking(token, rewards):
    return run("deploy_staking", "main", (token.address, DAY, rewards.address))


@pytest.fixture
def timelock_controller():
    return accounts[0].deploy(Timelock, [accounts[0]], [accounts[0]])


@pytest.fixture
def governance(staking, timelock_controller, web3):
    governance = accounts[0].deploy(Governance, staking, timelock_controller)
    timelock_controller.grantRole(web3.keccak(text="PROPOSER_ROLE"), governance)
    timelock_controller.grantRole(web3.keccak(text="EXECUTOR_ROLE"), governance)
    timelock_controller.grantRole(web3.keccak(text="CANCELLER_ROLE"), governance)
    return governance


@pytest.fixture
def optional_lockup_distributor(token, staking):
    return run(
        "deploy_optional_lockup_distributor",
        "main",
        (token.address, staking.address, test_merkle_data["merkle_root"]),
    )


@pytest.fixture
def mandatory_lockup_distributor(token, staking):
    return run(
        "deploy_mandatory_lockup_distributor",
        "main",
        (token.address, staking.address, test_merkle_data["merkle_root"]),
    )
