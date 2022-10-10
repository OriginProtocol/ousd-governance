import os

from brownie import *
from brownie.network import priority_fee


OGV_PROXY_ADDRESS = "0x9c354503c38481a7a7a51629142963f98ecc12d0"


def main():
	deployer = accounts.add(os.environ["DEPLOYER_KEY"])
	FROM = {'from': deployer}

	# Current OGV Proxy
	ogv_proxy = Contract.from_explorer(OGV_PROXY_ADDRESS)
	# Multi-sig wallet
	governor_addr = ogv_proxy.owner()

	# Dynamicly price gas, avoids over paying or TX's getting stuck
	# priority_fee("2 gwei")


	# Deploy new contract
	ogv_impl = OriginDollarGovernance.deploy({'from': deployer})
	# OriginDollarGovernance.publish_source(ogv_impl))


	# After deploy, governance action to upgrade to new contract

print("A")

# from world import *
# OGV_PROXY_ADDRESS = "0x9c354503c38481a7a7a51629142963f98ecc12d0"

# ogv_proxy = Contract.from_explorer(OGV_PROXY_ADDRESS)
# veogv = Contract.from_explorer('0x0C4576Ca1c365868E162554AF8e385dc3e7C66D9')
# ogv = Contract.from_explorer(ogv_proxy)
# airdrop1 = Contract.from_explorer("0x7ae2334f12a449895ad21d4c255d9de194fe986f")
# airdrop2 = Contract.from_explorer("0xd667091c2d1dcc8620f4eaea254cdfb0a176718d")

# # Run upgrade
# ogv_proxy.upgradeTo('0x7DFAFe7d547Fc9083719D633B9c5f6f542C42c77', {'from': GOV_MULTISIG})

# # Test OGV Burn 1
# airdrop1.burnRemainingOGV({'from': GOV_MULTISIG})
# show_transfers(history[-1])

# # Test OGV Burn 2
# airdrop2.burnRemainingOGV({'from': GOV_MULTISIG})
# show_transfers(history[-1])

# # Test OGV mint via staking collect
# print(c18(ogv.balanceOf(GOV_MULTISIG)))
# veogv.collectRewards({'from': GOV_MULTISIG})
# print(c18(ogv.balanceOf(GOV_MULTISIG)))
# show_transfers(history[-1])