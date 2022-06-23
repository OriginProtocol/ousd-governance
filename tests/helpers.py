from brownie import chain

H = 3600
DAY = 86400
WEEK = 7 * DAY
MAXTIME = 4 * 365 * DAY
TOL = 120 / WEEK


def approx(expected, received, precision=1e-10):
    if expected == received == 0:
        return True
    if (expected < 0 and received > 0) or (received < 0 and expected > 0):
        return False
    return abs(expected - received) / abs(expected) <= precision


def floor_week(timestamp):
    return timestamp - (timestamp % WEEK)


# Mine `amount` blocks using hardhat_mine, defaults to the length of the governance
# voting period (45818 blocks ~1 week )
def mine_blocks(web3, amount="0xB2FA", interval="0x1"):
    result = web3.provider.make_request("hardhat_mine", [amount, interval])
    # Using hardhat_mine seems to break the 0 base fee
    web3.provider.make_request("hardhat_setNextBlockBaseFeePerGas", ["0x0"])
    chain.mine()
