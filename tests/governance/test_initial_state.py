from brownie import accounts

from ..fixtures import governance, timelock_controller, token, vote_locker


def test_name(governance):
    assert governance.name() == "OUSD Governance"


def test_counting_mode(governance):
    assert governance.COUNTING_MODE() == "support=bravo&quorum=bravo"


def test_voting_delay(governance):
    assert governance.votingDelay() == 1  # 1 block


def test_voting_period(governance):
    assert governance.votingPeriod() == 45818  # 1 week in blocks


def test_quorum(governance, web3):
    assert governance.quorum(web3.eth.block_number) == 0


def test_voting_power(governance, web3):
    assert governance.getVotes(accounts[0], web3.eth.block_number) == 0


def test_timelock_min_delay(timelock_controller):
    assert timelock_controller.getMinDelay() == 86400 * 2
