import os

from brownie import *
from brownie.network import priority_fee
from common import *

# TODO: Update after deploying 006
XOGN_PROXY_ADDRESS = "0x8207c1ffc5b6804f6024322ccf34f29c3541ae26"

def main():
  timelock = Timelock.at(TIMELOCK)

  def deployment(deployer, FROM_DEPLOYER, FROM_MULTISIG, is_mainnet, is_fork):
    # Deploy OGN Governance
    xogn_governance = Governance.deploy(XOGN_PROXY_ADDRESS, TIMELOCK, FROM_DEPLOYER)
    print("xOGN Governance deployed at {}".format(xogn_governance.address))

    if is_mainnet:
      # Verify contract on etherscan on mainnet
      print("Verifying contract on Etherscan...")
      Governance.publish_source(xogn_governance)

    schedule_args = [
      [TIMELOCK, TIMELOCK, TIMELOCK], # Targets
      ['0', '0', '0'], # Values
      [
        # Grant proposer role to OGN Governance
        timelock.grantRole.encode_input(web3.keccak(text="PROPOSER_ROLE"), xogn_governance.address),
        # Grant canceller role to OGN Governance
        timelock.grantRole.encode_input(web3.keccak(text="CANCELLER_ROLE"), xogn_governance.address),
        # Grant executor role to OGN Governance
        timelock.grantRole.encode_input(web3.keccak(text="EXECUTOR_ROLE"), xogn_governance.address),
      ],
      '', # Predecessor
      '', # Salt
      timelock.getMinDelay() # Delay
    ]

    # Reduce minDelay on timelock to simulate execution
    accounts.at(TIMELOCK, force=True)
    timelock.updateDelay(100, {'from': TIMELOCK})

    return [
      ### OGN Governance
      {
        'contract': timelock,
        'function': timelock.scheduleBatch,
        'args': schedule_args
      },
    ]

  def post_execution(actions, FROM_MULTISIG):
    # Simulate execution on Timelock
    timetravel(200)

    timelock.executeBatch(*actions[0]['args'][:-1], FROM_MULTISIG)
    print("Simulated execution")

  dry_run = "DRY_RUN" in os.environ and os.environ["DRY_RUN"] != "false"
  multisigProposal(deployment, post_execution, dry_run=dry_run)
