from brownie import *
from pathlib import Path
import json

merkle_data = {
    "merkle_root": "0xfcc1b0ad120460132e0857a88f8d32203e184bf0fb2292f0150da3b6246e1501",
    "token_total": "0x0813f3978f89409844000000",
    "claims": {
        "0x0063046686E46Dc6F15918b61AE2B121458534a5": {
            "index": 0,
            "amount": "0x019d971e4fe8401e74000000",
            "proof": [
                "0xb503c0a1db70e0f0960e371d701b1a196e3e856cc4f7511c7d8c146b512a5c26",
                "0x2d3c1b10a410e1eb3b82e5fe1550936e113eb2815d55a6b2ec47c561af341c87",
                "0xebadd3177cb27611b5ebadf8d2d8838b1cf2849667feed3bc738fd83ad5ff9c8",
            ],
        },
        "0x21b42413bA931038f35e7A5224FaDb065d297Ba3": {
            "index": 1,
            "amount": "0x019d971e4fe8401e74000000",
            "proof": [
                "0x5f5ae032ee3e1c41be5d3f69a837e466a394d21fcff2b26439b5fe6b2a6afe91",
                "0x3e8f6ae35922341cd7259c72e37cf278e31d6be73ef226c80b705cb379d8f10f",
                "0xebadd3177cb27611b5ebadf8d2d8838b1cf2849667feed3bc738fd83ad5ff9c8",
            ],
        },
        "0x33A4622B82D4c04a53e170c638B944ce27cffce3": {
            "index": 2,
            "amount": "0x019d971e4fe8401e74000000",
            "proof": [
                "0x8e4792a49ddeea1f456d8efe2cb80e06bf7e5fca0330f49fcd2619568e2e96d9",
                "0x3e8f6ae35922341cd7259c72e37cf278e31d6be73ef226c80b705cb379d8f10f",
                "0xebadd3177cb27611b5ebadf8d2d8838b1cf2849667feed3bc738fd83ad5ff9c8",
            ],
        },
        "0x46C0a5326E643E4f71D3149d50B48216e174Ae84": {
            "index": 3,
            "amount": "0x019d971e4fe8401e74000000",
            "proof": [
                "0xd18db62bf0a3a6ff03e5d84980356521bac1784fcf3b750b4ff383031b039c48",
                "0x2d3c1b10a410e1eb3b82e5fe1550936e113eb2815d55a6b2ec47c561af341c87",
                "0xebadd3177cb27611b5ebadf8d2d8838b1cf2849667feed3bc738fd83ad5ff9c8",
            ],
        },
        "0x66aB6D9362d4F35596279692F0251Db635165871": {
            "index": 4,
            "amount": "0x019d971e4fe8401e74000000",
            "proof": [
                "0xf69e00be6fef3a87b4e216d056646c5279a77078c665b28c343d0410e07d7b1e"
            ],
        },
    },
}


def main(token_address, vote_locker_address):
    merkle_root = merkle_data["merkle_root"]
    return OptionalLockupDistributor.deploy(
        token_address, merkle_root, vote_locker_address
    )
