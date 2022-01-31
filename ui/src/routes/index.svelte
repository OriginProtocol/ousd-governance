<script lang="ts">
	import '../app.css';
	import ProposalList from '../proposal/ProposalList.svelte';
</script>

<main>
	<h1 class="text-3xl font-bold">Governance Overview</h1>
	<ProposalList />
</main>

<style type="text/postcss">
	main {
		@apply p-4;
	}
	h1 {
		@apply text-gray-600;
	}
</style>

