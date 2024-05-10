from brownie import *
from common import *

def migration_sanity_checks(migrator, xogn):
  print("Doing sanity checks...")

  ogv = OriginDollarGovernance.at(OGV_PROXY_ADDRESS)
  ogn = OriginDollarGovernance.at(OGN_ADDRESS)
  veogv = OgvStaking.at(VEOGV_PROXY_ADDRESS)
  
  ogn_governor = accounts.at(OGN_TOKEN_GOVERNOR, force=True)
  
  timelock = accounts.at(TIMELOCK, force=True)
  FROM_TIMELOCK = {'from': TIMELOCK}
  
  ogv_holder = accounts.at(GOV_MULTISIG, force=True)
  FROM_OGV_HOLDER = {'from': ogv_holder}

  # Make sure OGV rewards are collected
  veogv.collectRewards(FROM_OGV_HOLDER)

  # Team mints OGN and funds the Migrator
  ogn.mint(migrator.address, int(ogv.totalSupply() * 0.09137) + 10000e18, {'from': ogn_governor})

  # Team starts the migration and transfers out excess OGN
  migrator.start(FROM_TIMELOCK)
  if not migrator.isMigrationActive():
    raise "Migrator inactive"

  total_ogv = ogv.totalSupply()
  available_ogn = ogn.balanceOf(migrator.address)
  max_ogn_needed = int((total_ogv * 0.09137e18) / 1e18)
  print("Total OGV:       ", total_ogv)
  print("Available OGN:   ", available_ogn)
  print("Max OGN Needed:  ", max_ogn_needed)
  print("---------------")
  print("---------------")


  migrator.transferExcessTokens(OGN_TOKEN_GOVERNOR, FROM_TIMELOCK)
  total_ogv = ogv.totalSupply()
  available_ogn = ogn.balanceOf(migrator.address)
  max_ogn_needed = int((total_ogv * 0.09137e18) / 1e18)
  print("Total OGV:       ", total_ogv)
  print("Available OGN:   ", available_ogn)
  print("Max OGN Needed:  ", max_ogn_needed)
  print("---------------")
  print("---------------")

  # Someone migrates their OGV
  holder_balance = ogv.balanceOf(ogv_holder.address)
  print("OGV balance of user", holder_balance)
  print("OGN balance of user", ogn.balanceOf(ogv_holder.address))
  print("OGV total supply", ogv.totalSupply())
  print("Migrator OGN balance", ogn.balanceOf(migrator.address))
  print("---------------")
  ogv.approve(migrator.address, 1e40, FROM_OGV_HOLDER)
  migrator.migrate(holder_balance, FROM_OGV_HOLDER)
  print("OGV balance of user", ogv.balanceOf(ogv_holder.address))
  print("OGN balance of user", ogn.balanceOf(ogv_holder.address))
  print("OGV total supply", ogv.totalSupply())
  print("Migrator OGN balance", ogn.balanceOf(migrator.address))
  print("---------------")
  print("---------------")
  
  # Someone migrates their veOGV
  print("OGV total supply", ogv.totalSupply())
  print("Migrator OGN balance", ogn.balanceOf(migrator.address))
  print("---------------")
  migrator.migrate(
    [0],
    0,
    0,
    True,
    100000e18,
    365 * 24 * 60 * 60,
    FROM_OGV_HOLDER
  )
  print("OGV total supply", ogv.totalSupply())
  print("Migrator OGN balance", ogn.balanceOf(migrator.address))
  print("---------------")
  print("---------------")

  print("Done")
