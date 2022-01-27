<style type="text/postcss">
  main {
    @apply p-4;
  }
  h1 {
    @apply text-gray-600;
  }
</style>

<script lang="ts">
  import TailwindCSS from './style/TailwindCSS.svelte'
  import ProposalList from './proposal/ProposalList.svelte'
</script>

<TailwindCSS />

<main>
  <h1 class="text-3xl font-bold">Governance Overview</h1>
  <ProposalList />
</main>
