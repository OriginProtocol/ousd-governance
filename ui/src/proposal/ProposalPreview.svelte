<style>
</style>

<script>
  export let proposal = {}
  export let state = 0
</script>

<div class="pt-4">
  <div>
    <strong>Proposal ID:</strong>
    {proposal[0].toString()}
  </div>
  <div>
    <strong>Proposer:</strong>
    {proposal[1]}
  </div>
  <div>
    <strong>Executed:</strong>
    {proposal[3]}
  </div>
  <div>
    <strong>State:</strong>
    {#if state == 0}
      Pending
    {:else if state == 1}
      Queued
    {:else if state == 2}
      Expired
    {:else if state == 3}
      Executed
    {:else}
      {state} Unknown
    {/if}
  </div>
</div>
