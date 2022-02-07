<script lang="ts">
  import '../app.css';
  import { page } from '$app/stores';

  import Web3Button from '$components/Web3Button.svelte';

  let activeClass =
    'bg-indigo-800 text-white group flex items-center px-2 py-2 text-sm font-medium rounded-md';
  let inactiveClass =
    'text-indigo-100 hover:bg-indigo-600 group flex items-center px-2 py-2 text-sm font-medium rounded-md';
</script>

<div>
  <div class="fixed inset-0 flex z-40 md:hidden" role="dialog" aria-modal="true">
    <div class="fixed inset-0 bg-gray-600 bg-opacity-75" aria-hidden="true" />
    <div class="relative flex-1 flex flex-col max-w-xs w-full pt-5 pb-4 bg-indigo-700">
      <div class="absolute top-0 right-0 -mr-12 pt-2">
        <button
          type="button"
          class="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
        >
          <span class="sr-only">Close sidebar</span>
          <svg
            class="h-6 w-6 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div class="flex-shrink-0 flex items-center px-4">
        <div class="flex items-center flex-shrink-0 px-4 text-white font-semibold">
          OUSD Governance
        </div>
      </div>
      <div class="mt-5 flex-1 h-0 overflow-y-auto">
        <nav class="px-2 space-y-1">
          <a href="/" class={$page.url.pathname === '/' ? activeClass : inactiveClass}>
            Overview
          </a>
          <a
            href="/proposal"
            class={$page.url.pathname === '/proposal' ? activeClass : inactiveClass}
          >
            Proposals
          </a>
          <a
            href="/leaderboard"
            class={$page.url.pathname === '/leaderboard' ? activeClass : inactiveClass}
          >
            Leaderboard
          </a>
        </nav>
      </div>
    </div>
    <div class="flex-shrink-0 w-14" aria-hidden="true" />
  </div>

  <!-- Static sidebar for desktop -->
  <div class="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
    <!-- Sidebar component, swap this element with another sidebar if you like -->
    <div class="flex flex-col flex-grow pt-5 bg-indigo-700 overflow-y-auto">
      <div class="flex items-center flex-shrink-0 px-4 text-white font-semibold">
        OUSD Governance
      </div>
      <div class="mt-5 flex-1 flex flex-col">
        <nav class="flex-1 px-2 pb-4 space-y-1">
          <a href="/" class={$page.url.pathname === '/' ? activeClass : inactiveClass}>
            Overview
          </a>
          <a
            href="/proposal"
            class={$page.url.pathname === '/proposal' ? activeClass : inactiveClass}
          >
            Proposals
          </a>
          <a
            href="/leaderboard"
            class={$page.url.pathname === '/leaderboard' ? activeClass : inactiveClass}
          >
            Leaderboard
          </a>
        </nav>
      </div>
    </div>
  </div>

  <div class="md:pl-64 flex flex-col flex-1">
    <div
      class="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200"
    >
      <div class="flex items-right">
        <Web3Button />
      </div>
    </div>
    <slot />
  </div>
</div>
