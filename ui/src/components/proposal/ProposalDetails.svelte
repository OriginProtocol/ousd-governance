<script>
  import { governanceContract } from '../stores.js';
  export let proposalId;
  const actions = governanceContract.getActions(proposalId);
</script>

{#await actions}
  {actions}
{/await}
