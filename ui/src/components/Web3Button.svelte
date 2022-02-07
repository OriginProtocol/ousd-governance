<script>
  import { onMount } from 'svelte';

  import {
    defaultEvmStores,
    web3,
    selectedAccount,
    connected,
    chainId,
    chainData
  } from 'svelte-web3';

  const alchemyProvider = 'https://eth-mainnet.alchemyapi.io/v2/6vvlq0n_hjyPK4myUTJ4PGdD9AXjlPDq';

  let Web3Modal;
  let WalletConnectProvider;
  let WalletLink;
  let web3Modal;

  const enable = async () => {
    if (web3Modal) web3Modal.clearCachedProvider();
    const providerOptions = {
      walletconnect: {
        package: WalletConnectProvider,
        options: {
          rpc: {
            1: alchemyProvider
          }
        }
      },
      walletlink: {
        package: WalletLink,
        options: {
          url: alchemyProvider
        }
      }
    };

    web3Modal = new Web3Modal({
      cacheProvider: false,
      providerOptions: {},
      disableInjectedProvider: false
    });
    const provider = await web3Modal.connect();
    defaultEvmStores.setProvider(provider);
  };

  const disable = () => defaultEvmStores.disconnect();

  const debug = async () => {
    console.log('$web3.eth.getChainId', await $web3.eth.getChainId());
  };

  $: if ($connected && $web3) debug();

  onMount(async () => {
    console.log('Onmount');
    Web3Modal = (await import('web3modal')).default;
    // WalletConnectProvider = await import('@walletconnect/web3-provider');
    // WalletLink = (await import('walletlink')).default;
  });
</script>

{#if $web3.version}
  {#if $connected}
    <button on:click={disable}>Disconnect</button>
  {:else}
    <p>
      <button on:click={enable}>Connect</button>
    </p>
  {/if}
{/if}
