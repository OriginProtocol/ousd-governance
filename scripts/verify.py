from brownie import *
import json
import sys

# Script to verify contracts post-deployment
def main():
    map = json.load(open("./build/deployments/map.json"))

    if map:
        if web3.chain_id == 1:
            contracts = map["1"]
        elif web3.chain_id == 4:
            contracts = map["4"]
        else:
            sys.exit("You do not have to verify using a local node.")

        try:
            contract_1 = ERC1967Proxy.at(contracts["ERC1967Proxy"][0])
            ERC1967Proxy.publish_source(contract_1)
        except Exception as e:
            print(e)

        try:
            contract_2 = Governance.at(contracts["Governance"][0])
            Governance.publish_source(contract_2)
        except Exception as e:
            print(e)

        try:
            contract_3 = MandatoryLockupDistributor.at(contracts["MandatoryLockupDistributor"][0])
            MandatoryLockupDistributor.publish_source(contract_3)
        except Exception as e:
            print(e)

        try:
            contract_4 = OgvStaking.at(contracts["OgvStaking"][0])
            OgvStaking.publish_source(contract_4)
        except Exception as e:
            print(e)

        try:
            contract_5 = OptionalLockupDistributor.at(contracts["OptionalLockupDistributor"][0])
            OptionalLockupDistributor.publish_source(contract_5)
        except Exception as e:
            print(e)

        try:
            contract_6 = OriginDollarGovernance.at(contracts["OriginDollarGovernance"][0])
            OriginDollarGovernance.publish_source(contract_6)
        except Exception as e:
            print(e)

        try:
            contract_7 = RewardsSource.at(contracts["RewardsSource"][0])
            RewardsSource.publish_source(contract_7)
        except Exception as e:
            print(e)

        try:
            contract_8 = Timelock.at(contracts["Timelock"][0])
            Timelock.publish_source(contract_8)
        except Exception as e:
            print(e)
    else:
        sys.exit("No contracts deployed to verify.")