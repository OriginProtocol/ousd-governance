H = 3600
DAY = 86400
WEEK = 7 * DAY
MAXTIME = 4 * 365 * DAY
TOL = 120 / WEEK
ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

def approx(a, b, precision=1e-10):
    if a == b == 0:
        return True
    return 2 * abs(a - b) / (a + b) <= precision

def floor_week(timestamp):
    return timestamp - (timestamp % WEEK)
