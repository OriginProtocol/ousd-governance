from brownie import chain

H = 3600
DAY = 86400
WEEK = 7 * DAY
MONTH = 30 * DAY
YEAR = 365 * DAY
MAXTIME = 4 * 365 * DAY
#TOL = 120 / WEEK
TOL = 0.05
ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

def approx(a, b, precision=1e-10):
    if a == b == 0:
        return True
    return 2 * abs(a - b) / (a + b) <= precision

def floor_week(timestamp):
    return timestamp - (timestamp % WEEK)

# Mine `amount` blocks using hardhat_mine, defaults to the length of the governance
# voting period (45818 blocks ~1 week )
# 0x2cbe8 ~ 1 month
# 0x597d0 ~ 2 month
# 0x12e05e ~ 6 month
# 0x25c0bc ~ 1 year
def mine_blocks(web3, amount="0xB2FA"):
    web3.provider.make_request("hardhat_mine", [amount])
    # Using hardhat_mine seems to break the 0 base fee
    web3.provider.make_request("hardhat_setNextBlockBaseFeePerGas", ["0x0"])
    chain.mine()