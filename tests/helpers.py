DAY = 86400
WEEK = 7 * DAY

def approx(a, b, precision=1e-10):
    if a == b == 0:
        return True
    return 2 * abs(a - b) / (a + b) <= precision

def floor_week(timestamp):
    return timestamp - (timestamp % WEEK)
