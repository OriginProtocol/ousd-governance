from brownie import *
import os
from brownie.network import priority_fee

def main():
	deployer = accounts.add(os.environ["DEPLOYER_KEY"])
	FROM = {'from': deployer}

	OGV_PROXY_ADDRESS = "0x9c354503c38481a7a7a51629142963f98ecc12d0"
	REWARDS_PROXY_ADDRESS = "0x7d82e86cf1496f9485a8ea04012afeb3c7489397"

	is_mainnet = web3.chain_id == 1
	is_fork = web3.chain_id == 1337

	# Dynamicly price gas, avoids over paying or TX's getting stuck
	priority_fee("2 gwei")

	# Deployed RewardsSourceProxy contract
	rewards_proxy = RewardsSourceProxy.at(REWARDS_PROXY_ADDRESS)

	# Deploy new contract
	rewards_impl = RewardsSource.deploy(OGV_PROXY_ADDRESS, FROM)

	# Multi-sig wallet
	governor_addr = rewards_proxy.governor()

	# Transfer governance to multisig wallet
	rewards_impl.transferGovernance(governor_addr)

	if is_fork:
		# Impersonate on fork
		print("Impersonating governor multi-sig wallet on fork")
		governor = accounts.at(governor_addr, force=True)
		deployer.transfer(governor, "1 ether", required_confs=0, silent=True)

		# Upgrade to new implementation
		rewards_impl.claimGovernance({'from':governor})
		rewards_proxy.upgradeTo(rewards_impl, {'from':governor})
	else:
		# TODO: Is there anything to do here for the multi-sig wallet?
		print("WARN: Skipping claimGovernance and upgradeTo calls on mainnet")

	if is_mainnet:
		# Verify on mainnet
		RewardsSource.publish_source(rewards_impl)
