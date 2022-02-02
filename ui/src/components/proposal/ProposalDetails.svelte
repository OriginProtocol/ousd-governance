<script lang="ts">
  import { ethers } from 'ethers';
  import { addressesContracts, governanceContract } from '$src/stores.js';
  import Loading from '$components/Loading.svelte';

  export let proposalId: Number;

  const actions = governanceContract.getActions(proposalId);

  const decodeCalldata = (signature: String, calldata: String) => {
    const types = signature.split('(')[1].split(')')[0];
    return ethers.utils.defaultAbiCoder.decode(types.split(','), calldata);
  };

  const functionNameFromSignature = (signature: String) => {
    return signature.substring(0, signature.indexOf('('));
  };

  const addressContractName = (address: String) => {
    if (addressesContracts[address]) {
      return addressesContracts[address];
    }
    return address;
  };
</script>

{#await actions}
  <Loading />
{:then actionData}
  <div class="pb-2 mb-5 border-b border-gray-200">
    <h3 class="text-lg leading-6 font-medium text-gray-900">Vote</h3>
  </div>

  <div class="pb-2 mb-5 border-b border-gray-200">
    <h3 class="text-lg leading-6 font-medium text-gray-900">Governance Actions</h3>
  </div>
  <div class="bg-white shadow overflow-hidden sm:rounded-md text-sm mb-5">
    <ul role="list" class="divide-y divide-gray-200">
      {#each actionData.targets as target, i}
        <li>
          <div class="px-2 py-2 flex items-center sm:px-6">
            <a href={`https://etherscan.io/address/${target}`} target="_blank"
              >{addressContractName(target)}</a
            >.{functionNameFromSignature(actionData.signatures[i])}({decodeCalldata(
              actionData.signatures[i],
              actionData.calldatas[i]
            )})
          </div>
        </li>
      {/each}
    </ul>
  </div>

  <div class="pb-2 mb-5 border-b border-gray-200">
    <h3 class="text-lg leading-6 font-medium text-gray-900">Proposal Justification</h3>
  </div>
{/await}
