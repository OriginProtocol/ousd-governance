from brownie import *
import json
import sys

# Update governance contracts list
def main():
    map = json.load(open("./build/deployments/map.json"))

    if map:
        if web3.chain_id == 1:
            contracts = map["1"]
            output_file = "client/networks/governance.mainnet.json"
        elif web3.chain_id == 5:
            contracts = map["5"]
            output_file = "client/networks/governance.goerli.json"
        else:
            sys.exit("Script not needed when running a local node.")

        timelock = Timelock.at(contracts["Timelock"][0])
        governance = Governance.at(contracts["Governance"][0])

        output = json.load(open(output_file))

        output["TimelockController"] = dict(address=timelock.address, abi=timelock.abi)
        output["Governance"] = dict(address=governance.address, abi=governance.abi)

        with open(output_file, "w+") as f:
            json.dump(output, f, indent=2)
        
        sys.exit("Governance contracts list updated.")
    else:
        sys.exit("No map file found.")