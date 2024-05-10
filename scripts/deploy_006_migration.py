import os

from brownie import *
from brownie.network import priority_fee
from common import *
from .migration_sanity_checks import migration_sanity_checks

# TODO: Update after deploying buyback contracts
OUSD_BUYBACK_NEW_IMPL_ADDRESS = "0xbc77B8EFafabdF46f94Dfb4A422d541c5037799C"
OETH_BUYBACK_NEW_IMPL_ADDRESS = "0x69D343A52bC13Dc19cBD0d2A77baC320CCB69B9a"

xogn = None
migrator = None
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

    # Deploy veOGV implementation
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
    veogv = Contract.from_abi("OgvStaking", veogv_proxy.address, veogv_impl.abi)

    # Deploy xOGN implementation
    ogn_min_staking = 30 * 24 * 60 * 60 # 30 days
    ogn_epoch = 1716163200 # May 20, 2024 GMT
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
    global xogn
    xogn = Contract.from_abi("ExponentialStaking", xogn_proxy.address, xogn_impl.abi)

    # Deploy FixedRateRewardsSource
    rewards_per_second = 0 # TODO: Decide on the params
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
    global migrator
    migrator = Contract.from_abi("Migrator", migrator_proxy.address, migrator_impl.abi)

    if is_mainnet:
      # Verify contract on etherscan on mainnet
      print("Verifying contract on Etherscan...")

      # Verify proxies
      FixedRateRewardsSourceProxy.publish_source(ogn_rewardssource_proxy)
      MigratorProxy.publish_source(migrator_proxy)
      ExponentialStakingProxy.publish_source(xogn_proxy)

      # Verify implementations
      OgvStaking.publish_source(veogv_impl)
      FixedRateRewardsSource.publish_source(ogn_rewardssource_impl)
      Migrator.publish_source(migrator_impl)
      ExponentialStaking.publish_source(xogn_impl)
      
    return {
      'name': 'Deploy OGV-OGN Migration contracts and revoke OGV Governance roles',
      'actions': [
        ### OGV Governance
        {
          # Upgrade veOGV
          'contract': veogv_proxy,
          'signature': 'upgradeTo(address)',
          'args': [veogv_impl.address]
        },

        {
          # Revoke proposer role from OGV Governance
          'contract': timelock,
          'signature': 'revokeRole(bytes32,address)',
          'args': [web3.keccak(text="PROPOSER_ROLE"), GOVERNOR_FIVE]
        },
        {
          # Revoke canceller role from OGV Governance
          'contract': timelock,
          'signature': 'revokeRole(bytes32,address)',
          'args': [web3.keccak(text="CANCELLER_ROLE"), GOVERNOR_FIVE]
        },
        {
          # Revoke executor role from OGV Governance
          'contract': timelock,
          'signature': 'revokeRole(bytes32,address)',
          'args': [web3.keccak(text="EXECUTOR_ROLE"), GOVERNOR_FIVE]
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

  if is_fork:
    brownie.chain.snapshot()

  governanceProposal(deployment)
  
  if is_fork:
    migration_sanity_checks(migrator, xogn)
    brownie.chain.revert()