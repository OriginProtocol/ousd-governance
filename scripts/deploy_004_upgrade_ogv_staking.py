import os

from brownie import *
from brownie.network import priority_fee


OGV_PROXY_ADDRESS = "0x9c354503c38481a7a7a51629142963f98ecc12d0"
OGV_STAKING_PROXY = "0x0c4576ca1c365868e162554af8e385dc3e7c66d9"
REWARDS_PROXY_ADDRESS = "0x7d82e86cf1496f9485a8ea04012afeb3c7489397"

def main():
	deployer = accounts.add(os.environ["DEPLOYER_KEY"])
	FROM = {'from': deployer}

	local_provider = "127.0.0.1" in web3.provider.endpoint_uri or "localhost" in web3.provider.endpoint_uri
	is_mainnet = web3.chain_id == 1 and not local_provider
	is_fork = web3.chain_id == 1337 or local_provider

	# Current OGVStakingProxy
	staking_proxy = OgvStakingProxy.at(OGV_STAKING_PROXY)

	# Multi-sig wallet
	governor_addr = staking_proxy.governor()

	# # Dynamicly price gas, avoids over paying or TX's getting stuck
	# priority_fee("2 gwei")

	# Note: These params don't matter since the storage slots
	# of proxy contract will be used after upgrade
	min_staking = 7 * 24 * 60 * 60
	epoch = 1657584000

	# Deploy new implementation 
	staking_impl = OgvStaking.deploy(OGV_PROXY_ADDRESS, epoch, min_staking, REWARDS_PROXY_ADDRESS, FROM)

	# # Transfer governance to multisig wallet
	# staking_impl.transferGovernance(governor_addr)

	print("Contract deployed at {}".format(staking_impl.address))

	if is_mainnet:
		# Verify contract on etherscan on mainnet
		print("Verifying contract on Etherscan...")
		OgvStaking.publish_source(staking_impl)

	elif is_fork:
		# Impersonate on fork
		print("Impersonating governor multi-sig wallet on fork")
		governor = accounts.at(governor_addr, force=True)
		# deployer.transfer(governor, "1 ether", required_confs=0, silent=True)

		# # Upgrade to new implementation
		# staking_impl.claimGovernance({'from':governor})
		staking_proxy.upgradeTo(staking_impl, {'from':governor})

	return Contract.from_abi("OgvStaking", staking_proxy.address, staking_impl.abi)