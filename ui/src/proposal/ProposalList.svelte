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

  const proposals = governanceContract.proposalCount().then(async count => {
    console.debug(`Found ${count.toString()} proposals`)
    const proposalGets = []
    const proposalStateGets = []
    for (let i = 1; i <= count; i++) {
      proposalGets.push(governanceContract.proposals(i))
      proposalStateGets.push(governanceContract.state(i))
    }
    return {
      count,
      proposals: await Promise.all(proposalGets),
      states: await Promise.all(proposalStateGets)
    }
  })
</script>

{#await proposals then proposalData}
  {#each proposalData.proposals as proposal, i}
    <ProposalPreview {proposal} state={proposalData.states[i]} />
  {/each}
{/await}
