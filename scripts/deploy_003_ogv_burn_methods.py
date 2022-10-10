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
	priority_fee("2 gwei")

	# Deploy new contract
	ogv_impl = OriginDollarGovernance.deploy({'from': deployer})
	OriginDollarGovernance.publish_source(ogv_impl)