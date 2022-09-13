import os
from brownie import *
from brownie.network import priority_fee

def main():
	deployer = accounts.add(os.environ["DEPLOYER_KEY"])
	STAKING = "0x0c4576ca1c365868e162554af8e385dc3e7c66d9"
	FROM = {'from': deployer}

	# Dynamicly price gas, avoids over paying or TX's getting stuck
	priority_fee("2 gwei")

	# Deploy Timelock
	timelock = Timelock.deploy([], [], FROM)
	Timelock.publish_source(timelock)

	# Deploy Governor
	governance = Governance.deploy(STAKING, timelock, FROM)
	Governance.publish_source(governance)

	# Configure Timelock

	# Governance can control timelock actions
	timelock.grantRole(web3.keccak(text="PROPOSER_ROLE"), governance, FROM)
	timelock.grantRole(web3.keccak(text="CANCELLER_ROLE"), governance, FROM)
	timelock.grantRole(web3.keccak(text="EXECUTOR_ROLE"), governance, FROM)

	# Renounce our deployer powers over the timelock
	timelock.renounceRole(web3.keccak(text="TIMELOCK_ADMIN_ROLE"), accounts[0], FROM)


