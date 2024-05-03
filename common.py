import os
from brownie import *
import brownie

BLOCK_INTERVAL = 12 # 1 block every 12 seconds
BLOCKS_PER_DAY = 86400 / BLOCK_INTERVAL

STRATEGIST = '0xF14BBdf064E3F67f51cd9BD646aE3716aD938FDC'
GOV_MULTISIG = '0xbe2AB3d3d8F6a32b96414ebbd865dBD276d3d899'
GOVERNOR_FIVE = '0x3cdd07c16614059e66344a7b579dab4f9516c0b6'
TIMELOCK = '0x35918cDE7233F2dD33fA41ae3Cb6aE0e42E0e69F'

class TemporaryFork:
    def __enter__(self):
        brownie.chain.snapshot()

    def __exit__(self, *args, **kwargs):
        brownie.chain.revert()

# Creates a proposal on OGV Governance by 5/8 Governance Multi-sig. 
# Multisig has enough veOGV to be able to propose changes. 
def governanceProposal(deployment):
    deployer = accounts.add(os.environ["DEPLOYER_KEY"])
    FROM_DEPLOYER = {'from': deployer}
    local_provider = "127.0.0.1" in web3.provider.endpoint_uri or "localhost" in web3.provider.endpoint_uri
    is_mainnet = web3.chain_id == 1 and not local_provider
    is_fork = web3.chain_id == 1337 or local_provider
    is_proposal_mode = os.getenv('MODE') == 'build_ogv_gov_proposal'

    deploymentInfo = deployment(deployer, FROM_DEPLOYER, local_provider, is_mainnet, is_fork, is_proposal_mode)

    impersonate_sim = os.getenv('IMPERSONATE_SIM') == 'true'

    if not is_proposal_mode:
        return

    actions = deploymentInfo['actions']

    if (len(actions) > 0):
        if impersonate_sim:
            # Impersonate timelock and simulate the actions
            # bypassing the proposal flow (makes testing faster)
            timelock = accounts.at(TIMELOCK, force=True)
            for action in actions:
                fn = getattr(action['contract'], action['signature'][:action['signature'].index('(')])
                fn(*action['args'], {'from': timelock})

            return

        ogvGovernor = Governance.at(GOVERNOR_FIVE)

        proposal_args = [
            [action['contract'].address for action in actions],
            [0 for action in actions],
            [action['signature'] for action in actions],
            # To explain this code salad:
            #  - action['signature'][:action['signature'].index('(')] -> this part gets the function name from signature
            #  - encode_input(*action['args']) -> encodes said function data
            #  - [10:] trim first 10 character to trim function name signature away from data
            [getattr(action['contract'], action['signature'][:action['signature'].index('(')]).encode_input(*action['args'])[10:] for action in actions],
            deploymentInfo['name'],
        ]

        if is_fork:
            print('Creating governance proposal on fork')
            propose_tx = ogvGovernor.propose(
                *proposal_args,
                {'from': GOV_MULTISIG}
            )
            # Simulate execution on fork
            proposalId = propose_tx.events['ProposalCreated'][0][0]['proposalId']
            print("Created proposal", proposalId)

            # Move forward 30s so that we can vote
            timetravel(30)

            # Vote on Proposal
            print("Voting on the proposal")
            ogvGovernor.castVote(proposalId, 1, {'from': GOV_MULTISIG})
            
            # 2 days to queue (+0.5 day for buffer)
            timetravel(86400 * 2.5)

            print("Queueing proposal")
            ogvGovernor.queue(proposalId, {'from': GOV_MULTISIG})

            # 2 day timelock (+0.5 day for buffer)
            timetravel(86400 * 2.5)

            print("Executing proposal")
            ogvGovernor.execute(proposalId, {'from': GOV_MULTISIG})

        else:
            propose_data = ogvGovernor.propose.encode_input(
                *proposal_args
            )

        print("Raw Args", proposal_args)

        print("Execute the following transaction to create OGV Governance proposal")
        print("To: {}".format(GOVERNOR_FIVE))
        print("Data: {}".format(propose_data))


def timetravel(seconds):
    brownie.chain.sleep(int(seconds) + 1)
    brownie.chain.mine(int(seconds / BLOCK_INTERVAL) + 1)
