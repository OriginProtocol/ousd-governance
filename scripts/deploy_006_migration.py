import os

from brownie import *
from brownie.network import priority_fee
from common import *

VEOGV_PROXY_ADDRESS = "0x0c4576ca1c365868e162554af8e385dc3e7c66d9"
OGV_PROXY_ADDRESS = "0x9c354503c38481a7a7a51629142963f98ecc12d0"
REWARDS_PROXY_ADDRESS = "0x7d82e86cf1496f9485a8ea04012afeb3c7489397"

OGN_ADDRESS = "0x8207c1ffc5b6804f6024322ccf34f29c3541ae26"

OUSD_BUYBACK_PROXY_ADDRESS = "0xD7B28d06365b85933c64E11e639EA0d3bC0e3BaB"
OETH_BUYBACK_PROXY_ADDRESS = "0xFD6c58850caCF9cCF6e8Aee479BFb4Df14a362D2"

# TODO: Update after deploying buyback contracts
OUSD_BUYBACK_NEW_IMPL_ADDRESS = "0xdd753cb1fc4e8c72c5a40254ac064515301d11e0"
OETH_BUYBACK_NEW_IMPL_ADDRESS = "0x6c952cc410a253e70f3383028c7e0a7f477b921c"

def main():
  def deployment(deployer, FROM_DEPLOYER, local_provider, is_mainnet, is_fork, is_proposal_mode):
    veogv_proxy = Contract.from_abi("OgvStakingProxy", VEOGV_PROXY_ADDRESS, OgvStakingProxy.abi)

    timelock = Timelock.at(TIMELOCK)
    
    # Deploy proxies
    ogn_rewardssource_proxy = FixedRateRewardsSourceProxy.deploy(FROM_DEPLOYER)
    print("FixedRateRewardsSourceProxy deployed at {}".format(ogn_rewardssource_proxy.address))
    migrator_proxy = MigratorProxy.deploy(FROM_DEPLOYER)
    print("MigratorProxy deployed at {}".format(migrator_proxy.address))
    xogn_proxy = ExponentialStakingProxy.deploy(FROM_DEPLOYER)
    print("ExponentialStakingProxy deployed at {}".format(xogn_proxy.address))

    ousd_buyback_proxy = InitializeGovernedUpgradeabilityProxy.at(OUSD_BUYBACK_PROXY_ADDRESS)
    oeth_buyback_proxy = InitializeGovernedUpgradeabilityProxy.at(OETH_BUYBACK_PROXY_ADDRESS)
    ousd_buyback = interface.IBuyback(ousd_buyback_proxy.address)
    oeth_buyback = interface.IBuyback(oeth_buyback_proxy.address)

    # Deploy OGN Governance
    xogn_governance = Governance.deploy(xogn_proxy, TIMELOCK, FROM_DEPLOYER)
    # TODO: Decide on Governance params
    print("xOGN Governance deployed at {}".format(xogn_governance.address))

    # Deploy OGV implementation
    ogv_min_staking = 30 * 24 * 60 * 60 # 2592000 -> 30 days
    ogv_epoch = 1657584000
    veogv_impl = OgvStaking.deploy(
      OGV_PROXY_ADDRESS, 
      ogv_epoch, 
      ogv_min_staking, 
      REWARDS_PROXY_ADDRESS, 
      migrator_proxy.address, 
      FROM_DEPLOYER
    )
    print("OGVStaking Implementation deployed at {}".format(veogv_impl.address))

    # Deploy xOGN implementation
    ogn_min_staking = 7 * 24 * 60 * 60 # 7 days
    ogn_epoch = 24 * 60 * 60 # 1 day
    xogn_impl = ExponentialStaking.deploy(
      OGN_ADDRESS, 
      ogn_epoch, 
      ogn_min_staking, 
      ogn_rewardssource_proxy.address,
      FROM_DEPLOYER
    )
    print("ExponentialStaking implementation deployed at {}".format(xogn_impl.address))
    xogn_proxy.initialize(
      xogn_impl.address,
      TIMELOCK,
      b'',
      FROM_DEPLOYER
    )
    print("ExponentialStaking proxy initialized")

    # Deploy FixedRateRewardsSource
    rewards_per_second = 100 # TODO: Decide on the params
    ogn_rewardssource_impl = FixedRateRewardsSource.deploy(OGN_ADDRESS, FROM_DEPLOYER)
    print("FixedRateRewardsSource implementation deployed at {}".format(ogn_rewardssource_impl.address))
    # ogn_rewardssource = FixedRateRewardsSource.at(ogn_rewardssource_proxy.address)
    impl_init_data = ogn_rewardssource_impl.initialize.encode_input(STRATEGIST, xogn_proxy.address, rewards_per_second)
    ogn_rewardssource_proxy.initialize(
      ogn_rewardssource_impl.address,
      TIMELOCK,
      impl_init_data,
      FROM_DEPLOYER
    )
    print("FixedRateRewardsSource proxy initialized")

    # Deploy Migrator implementation
    migrator_impl = Migrator.deploy(
      OGV_PROXY_ADDRESS,
      OGN_ADDRESS,
      VEOGV_PROXY_ADDRESS,
      xogn_proxy.address,
      FROM_DEPLOYER
    )
    print("Migrator implementation deployed at {}".format(migrator_impl.address))
    migrator_proxy.initialize(
      migrator_impl.address,
      TIMELOCK,
      b'',
      FROM_DEPLOYER
    )
    print("Migrator proxy initialized")
    # migrator = Migrator.at(migrator_proxy.address)

    if is_mainnet:
      # Verify contract on etherscan on mainnet
      print("Verifying contract on Etherscan...")

      # Verify proxies
      FixedRateRewardsSourceProxy.publish_source(ogn_rewardssource_proxy)
      MigratorProxy.publish_source(migrator_proxy)
      ExponentialStakingProxy.publish_source(xogn_proxy)

      # Verify Governance
      Governance.publish_source(xogn_governance)

      # Verify implementations
      OgvStaking.publish_source(veogv_impl)
      FixedRateRewardsSource.publish_source(ogn_rewardssource_impl)
      Migrator.publish_source(migrator_impl)
      ExponentialStaking.publish_source(xogn_impl)
      
    return {
      'name': 'Deploy OGV-OGN Migration contracts and OGN Governance',
      'actions': [
        ### OGV Governance
        {
          # Upgrade veOGV
          'contract': veogv_proxy,
          'signature': 'upgradeTo(address)',
          'args': [veogv_impl.address]
        },

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

        ### Buybacks
        {
          # Upgrade OUSD Buyback
          'contract': ousd_buyback_proxy,
          'signature': 'upgradeTo(address)',
          'args': [OUSD_BUYBACK_NEW_IMPL_ADDRESS]
        },
        {
          # Upgrade OETH Buyback
          'contract': oeth_buyback_proxy,
          'signature': 'upgradeTo(address)',
          'args': [OETH_BUYBACK_NEW_IMPL_ADDRESS]
        },
        {
          # Configure OUSD Buyback
          'contract': ousd_buyback,
          'signature': 'setRewardsSource(address)',
          'args': [ogn_rewardssource_proxy.address]
        },
        {
          # Configure OETH Buyback
          'contract': oeth_buyback_proxy,
          'signature': 'upgradeTo(address)',
          'args': [ogn_rewardssource_proxy.address]
        }
      ]
    }

  governanceProposal(deployment)
