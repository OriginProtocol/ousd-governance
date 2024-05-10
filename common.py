import os
from brownie import *
import brownie
import time

BLOCK_INTERVAL = 12 # 1 block every 12 seconds
BLOCKS_PER_DAY = 86400 / BLOCK_INTERVAL

STRATEGIST = '0xF14BBdf064E3F67f51cd9BD646aE3716aD938FDC'
GOV_MULTISIG = '0xbe2AB3d3d8F6a32b96414ebbd865dBD276d3d899'
GOVERNOR_FIVE = '0x3cdd07c16614059e66344a7b579dab4f9516c0b6'
TIMELOCK = '0x35918cDE7233F2dD33fA41ae3Cb6aE0e42E0e69F'

OGN_ADDRESS = "0x8207c1ffc5b6804f6024322ccf34f29c3541ae26"
VEOGV_PROXY_ADDRESS = "0x0c4576ca1c365868e162554af8e385dc3e7c66d9"
OGV_PROXY_ADDRESS = "0x9c354503c38481a7a7a51629142963f98ecc12d0"
REWARDS_PROXY_ADDRESS = "0x7d82e86cf1496f9485a8ea04012afeb3c7489397"

OGN_TOKEN_GOVERNOR = "0x72426BA137DEC62657306b12B1E869d43FeC6eC7"

OUSD_BUYBACK_PROXY_ADDRESS = "0xD7B28d06365b85933c64E11e639EA0d3bC0e3BaB"
OETH_BUYBACK_PROXY_ADDRESS = "0xFD6c58850caCF9cCF6e8Aee479BFb4Df14a362D2"

local_provider = "127.0.0.1" in web3.provider.endpoint_uri or "localhost" in web3.provider.endpoint_uri
is_mainnet = web3.chain_id == 1 and not local_provider
is_fork = web3.chain_id == 1337 or local_provider

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
    is_proposal_mode = os.getenv('MODE') == 'build_ogv_gov_proposal'

    deploymentInfo = deployment(deployer, FROM_DEPLOYER, local_provider, is_mainnet, is_fork, is_proposal_mode)

    if not is_proposal_mode:
        return

    actions = deploymentInfo['actions']

    if (len(actions) > 0):
        if os.getenv('IMPERSONATE_SIM') == 'true':
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

        propose_data = ogvGovernor.propose.encode_input(
            *proposal_args
        )

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

        print("Raw Args", proposal_args)

        print("Execute the following transaction to create the Governance proposal")
        print("To: {}".format(GOVERNOR_FIVE))
        print("Data: {}".format(propose_data))

def multisigProposal(deployment, post_execution, dry_run=False):
    deployer = accounts.add(os.environ["DEPLOYER_KEY"])
    FROM_DEPLOYER = {'from': deployer}
    FROM_MULTISIG = {'from': GOV_MULTISIG}

    if dry_run:
        # Take a snapshot
        brownie.chain.snapshot()

    multisig_actions = deployment(deployer, FROM_DEPLOYER, FROM_MULTISIG, is_mainnet, is_fork)

    if len(multisig_actions) == 0:
        # Revert snapshot
        brownie.chain.revert()
        return

    # Build actions
    print("Impersonating multisig to simulate actions...")
    accounts.at(GOV_MULTISIG, force=True)

    failed = False
    txs = []
    for action in multisig_actions:
        try:
            # Run action
            action['function'](*action['args'], { 'from': GOV_MULTISIG })

            # Add to list to build Gnosis JSON
            txs.append({
                'to': action['contract'].address,
                'data': action['function'].encode_input(*action['args']),
                'value': '0',
                "contractMethod": None,
                "contractInputsValues": None,
            })
        except e:
            failed = True
            print("Failing to run multisig action", e)
            break

    if not failed:
        if post_execution is not None:
            post_execution(multisig_actions, FROM_MULTISIG)

        gnosis_json = {
            "version": "1.0",
            "chainId": "1",
            "createdAt": int(time.time()),
            "meta": {
                "name": "Transactions Batch",
                "description": "",
                "txBuilderVersion": "1.16.1",
                "createdFromSafeAddress": "0xF14BBdf064E3F67f51cd9BD646aE3716aD938FDC",
                "createdFromOwnerAddress": "",
                # "checksum": "0x"
            },
            "transactions": txs,
        }
        print("\n\nGnosis json:")
        print(gnosis_json)
        print("\n\n")

    if dry_run:
        # Revert snapshot
        brownie.chain.revert()

def timetravel(seconds):
    brownie.chain.sleep(int(seconds) + 1)
    brownie.chain.mine(int(seconds / BLOCK_INTERVAL) + 1)
