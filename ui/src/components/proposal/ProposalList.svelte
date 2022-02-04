<script>
  import { goto } from '$app/navigation';
  import ProposalPreview from '$components/proposal/ProposalPreview.svelte';
  import Loading from '$components/Loading.svelte';
  import { governanceContract } from '$src/stores.js';

  const proposals = governanceContract.proposalCount().then(async (count) => {
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
  <div class="mb-5">
    <button
      type="button"
      class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      on:click={() => goto(`/proposal/new`)}
    >
      New Proposal
    </button>
  </div>
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
