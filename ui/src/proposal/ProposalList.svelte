<script>
  import { ethers } from 'ethers'
  import governanceAbi from '../abi/Governor.js'
  import ProposalPreview from './ProposalPreview.svelte'

  const provider = new ethers.providers.JsonRpcProvider(
    'https://eth-mainnet.alchemyapi.io/v2/6vvlq0n_hjyPK4myUTJ4PGdD9AXjlPDq'
  )
  const governanceAddress = '0x72426BA137DEC62657306b12B1E869d43FeC6eC7'
  const governanceContract = new ethers.Contract(
    governanceAddress,
    governanceAbi,
    provider
  )

  const proposalCount = governanceContract.proposalCount()

  console.debug('Proposal count:', proposalCount)

  const proposalGets = []
  const proposalStateGets = []
  for (const i = 0; i < proposalCount; i++) {
    proposalGets.push(governanceContract.proposals(i))
    proposalStateGets.push(governanceContract.state(i))
  }
</script>

{#await Promise.all(proposalGets) then proposals}
  {#await Promise.all(proposalStateGets) then proposalStates}
    {#each proposals as proposal, i}
      <ProposalPreview {proposal} state={proposalStates[i]} />
    {/each}
  {/await}
{/await}
