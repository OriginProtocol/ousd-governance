from brownie import chain

DAY = 86400
WEEK = 7 * DAY


def approx(a, b, precision=1e-10):
    if a == b == 0:
        return True
    return 2 * abs(a - b) / (a + b) <= precision


def floor_week(timestamp):
    return timestamp - (timestamp % WEEK)


# Mine `amount` blocks using hardhat_mine, defaults to the length of the governance
# voting period (45818 blocks ~1 week )
def mine_blocks(web3, amount="0xB2FA", interval="0x1"):
    result = web3.provider.make_request("hardhat_mine", [amount, interval])
    # Using hardhat_mine seems to break the 0 base fee
    web3.provider.make_request("hardhat_setNextBlockBaseFeePerGas", ["0x0"])
    chain.mine()
