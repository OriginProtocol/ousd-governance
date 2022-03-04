from ..fixtures import timelock_controller


def test_timelock_settings(timelock_controller):
    assert timelock_controller.getMinDelay() == 86400 * 2
