<script>
  import { ethers } from 'ethers';
  import governanceAbi from '../abi/Governor.js';
  import ProposalPreview from './ProposalPreview.svelte';
  import Loading from '../components/Loading.svelte';

  const provider = new ethers.providers.JsonRpcProvider(
    'https://eth-mainnet.alchemyapi.io/v2/6vvlq0n_hjyPK4myUTJ4PGdD9AXjlPDq'
  );
  const governanceAddress = '0x72426BA137DEC62657306b12B1E869d43FeC6eC7';
  const governanceContract = new ethers.Contract(governanceAddress, governanceAbi, provider);

  const proposals = governanceContract.proposalCount().then(async (count) => {
    console.debug(`Found ${count.toString()} proposals`);
    const proposalGets = [];
    const proposalStateGets = [];
    for (let i = 1; i <= count; i++) {
      proposalGets.push(governanceContract.proposals(i));
      proposalStateGets.push(governanceContract.state(i));
    }
    return {
      count,
      proposals: await Promise.all(proposalGets),
      states: await Promise.all(proposalStateGets)
    };
  });
</script>

{#await proposals}
  <Loading />
{:then proposalData}
  <div class="flex flex-col">
    <div class="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
      <div class="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
        <div class="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  #
                </th>
                <th
                  scope="col"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Proposer
                </th>
                <th
                  scope="col"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  State
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              {#each proposalData.proposals as proposal, i}
                <ProposalPreview {proposal} state={proposalData.states[i]} index={i} />
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
{/await}
