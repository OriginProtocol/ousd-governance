from brownie import chain

H = 3600
DAY = 86400
WEEK = 7 * DAY
MAXTIME = 4 * 365 * DAY
TOL = 120 / WEEK


def approx(expected, actual, precision=1e-10):
    if expected == actual == 0:
        return True
    # one is 0 and the other isn't
    if (expected == 0 or actual == 0) and (expected != 0 or actual != 0):
        return False
    if (expected < 0 and actual > 0) or (actual < 0 and expected > 0):
        return False
    return abs(expected - actual) / abs(expected) <= precision


def floor_week(timestamp):
    return timestamp - (timestamp % WEEK)


# Mine `amount` blocks using hardhat_mine, defaults to the length of the governance
# voting period (32727 blocks ~5 days )
def mine_blocks(web3, amount="0x7fd7", interval="0x1"):
    web3.provider.make_request("hardhat_mine", [amount, interval])
    # Using hardhat_mine seems to break the 0 base fee
    web3.provider.make_request("hardhat_setNextBlockBaseFeePerGas", ["0x0"])
    chain.mine()
