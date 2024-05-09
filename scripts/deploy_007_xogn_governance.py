import os

from brownie import *
from brownie.network import priority_fee
from common import *

# TODO: Update after deploying 006
XOGN_PROXY_ADDRESS = "0x8207c1ffc5b6804f6024322ccf34f29c3541ae26"

def main():
  def deployment(deployer, FROM_DEPLOYER, local_provider, is_mainnet, is_fork, is_proposal_mode):
    timelock = Timelock.at(TIMELOCK)
    
    # Deploy OGN Governance
    xogn_governance = Governance.deploy(XOGN_PROXY_ADDRESS, TIMELOCK, FROM_DEPLOYER)
    print("xOGN Governance deployed at {}".format(xogn_governance.address))

    if is_mainnet:
      # Verify contract on etherscan on mainnet
      print("Verifying contract on Etherscan...")
      Governance.publish_source(xogn_governance)
      
    return {
      'name': 'Deploy OGN Governance',
      'actions': [
        ### OGN Governance
        {
          # Grant proposer role to OGN Governance
          'contract': timelock,
          'signature': 'grantRole(bytes32,address)',
          'args': [web3.keccak(text="PROPOSER_ROLE"), xogn_governance.address]
        },
        {
          # Grant canceller role to OGN Governance
          'contract': timelock,
          'signature': 'grantRole(bytes32,address)',
          'args': [web3.keccak(text="CANCELLER_ROLE"), xogn_governance.address]
        },
        {
          # Grant executor role to OGN Governance
          'contract': timelock,
          'signature': 'grantRole(bytes32,address)',
          'args': [web3.keccak(text="EXECUTOR_ROLE"), xogn_governance.address]
        },
      ]
    }

  governanceProposal(deployment)
