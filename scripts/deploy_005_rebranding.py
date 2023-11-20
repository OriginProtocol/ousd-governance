import os

from brownie import *
from brownie.network import priority_fee
from common import *

OGV_PROXY_ADDRESS = "0x9c354503c38481a7a7a51629142963f98ecc12d0"
VEOGV_PROXY_ADDRESS = "0x0c4576ca1c365868e162554af8e385dc3e7c66d9"
REWARDS_PROXY_ADDRESS = "0x7d82e86cf1496f9485a8ea04012afeb3c7489397"
GOVERNANCE_ADDRESS = "0x3cdd07c16614059e66344a7b579dab4f9516c0b6"

def main():
  def deployment(deployer, FROM_DEPLOYER, local_provider, is_mainnet, is_fork, is_proposal_mode):
    # Existing contracts
    veogv_proxy = OgvStakingProxy.at(VEOGV_PROXY_ADDRESS)
    ogv_proxy = OriginDollarGovernance.at(OGV_PROXY_ADDRESS)
    governance = Governance.at(GOVERNANCE_ADDRESS)
  
    if not is_fork:
      # Dynamicly price gas, avoids over paying or TX's getting stuck
      priority_fee("2 gwei")

    # these values are marked as immutable in the contract and for that reason
    # the compiler does not reserve storage slots for them - rather they are
    # copied to all the places in the code where they are used. It is important
    # that we use the correct values in the constructor
    #
    # https://docs.soliditylang.org/en/v0.8.17/contracts.html#constant-and-immutable-state-variables
    min_staking = 30 * 24 * 60 * 60 # 2592000 -> 30 days
    epoch = 1657584000

    # Deploy new implementations
    veogv_impl = OgvStaking.deploy(OGV_PROXY_ADDRESS, epoch, min_staking, REWARDS_PROXY_ADDRESS, FROM_DEPLOYER)
    print("OGVStaking Implementation deployed at {}".format(veogv_impl.address))

    ogv_impl = OriginDollarGovernance.deploy(FROM_DEPLOYER)
    print("OriginDollarGovernance Implementation deployed at {}".format(ogv_impl.address))

    if is_mainnet:
      # Verify contract on etherscan on mainnet
      print("Verifying contract on Etherscan...")

      OgvStaking.publish_source(veogv_impl)
      OriginDollarGovernance.publish_source(ogv_impl)

    return {
      'name': 'Rebrand OGV contracts and adjust governance parameters',
      'actions': [
        {
          'contract': veogv_proxy,
          'signature': 'upgradeTo(address)',
          'args': [veogv_impl.address]
        },
        {
          'contract': ogv_proxy,
          'signature': 'upgradeTo(address)',
          'args': [ogv_impl.address]
        },
        {
          'contract': governance,
          'signature': 'setVotingPeriod(uint256)',
          'args': [BLOCKS_PER_DAY * 3] # 3 days
        },
        {
          'contract': governance,
          'signature': 'setLateQuorumVoteExtension(uint64)',
          'args': [BLOCKS_PER_DAY * 1] # 1 day
        },
      ]
    }

  governanceProposal(deployment)