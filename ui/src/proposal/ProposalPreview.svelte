<script>
  export let proposal = {};
  export let state = 0;
  export let index = 0;
</script>

<tr class={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
    {proposal[0].toString()}
  </td>
  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500"> {proposal[1]} </td>
  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
  </td>
</tr>
