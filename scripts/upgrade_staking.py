from brownie import *


def main():
    owner = "0x71f78361537a6f7b6818e7a760c8bc0146d93f50"
    web3.provider.make_request("hardhat_impersonate", [owner])

    staking_impl = Contract.from_abi(
        "OgvStaking", "0xFdb16A6900Ce90Cb27Afec95dc274D27E0d61b87", OgvStaking.abi
    )
    new_staking_impl = OgvStaking.deploy({"from": accounts[0]})
    ogv_address = "0x9c354503c38481a7a7a51629142963f98ecc12d0"
    rewards_address = "0x9c354503c38481a7a7a51629142963f98ecc12d0"
    staking_impl.upgradeToAndCall(
        new_staking_impl.address,
        staking_impl.configure.encode_input(
            ogv_address,
            rewards_address,
        ),
        {"from": owner},
    )
    import pdb

    pdb.set_trace()
    return staking_impl
