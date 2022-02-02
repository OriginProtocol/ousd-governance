<script context="module">
  export async function load({ params }) {
    return {
      props: {
        proposalId: params.id
      }
    };
  }
</script>

<script>
  export let proposalId;
</script>

<div class="py-6">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pb-6">
    <h1 class="text-2xl font-semibold text-gray-900">Proposal {proposalId}</h1>
  </div>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 md:px-8" />
</div>
