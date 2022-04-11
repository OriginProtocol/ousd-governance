import WalletConnectProvider from "@walletconnect/web3-provider";
import { providers } from "ethers";
import { useCallback, useEffect } from "react";
import WalletLink from "walletlink";
import Web3Modal from "web3modal";
import { truncateEthAddress, useNetworkInfo } from "utils/index";
import { useStore } from "utils/store";
import { INFURA_ID, mainnetNetworkUrl } from "constants/index";
import { toast } from "react-toastify";

const providerOptions = {
  walletconnect: {
    package: WalletConnectProvider, // required
    options: {
      infuraId: INFURA_ID, // required
    },
  },
  "custom-walletlink": {
    display: {
      logo: "https://play-lh.googleusercontent.com/PjoJoG27miSglVBXoXrxBSLveV6e3EeBPpNY55aiUUBM9Q1RCETKCOqdOkX2ZydqVf0",
      name: "Coinbase",
      description: "Connect to Coinbase Wallet (not Coinbase App)",
    },
    options: {
      appName: "Coinbase", // Your app name
      networkUrl: mainnetNetworkUrl,
      chainId: 1,
    },
    package: WalletLink,
    connector: async (_: any, options: any) => {
      const { appName, networkUrl, chainId } = options;
      const walletLink = new WalletLink({
        appName,
      });
      const provider = walletLink.makeWeb3Provider(networkUrl, chainId);
      await provider.enable();
      return provider;
    },
  },
};

const networkNameMap = {
  1: "Mainnet",
  4: "Rinkeby",
  31337: "localhost",
};

let web3Modal: any | undefined;
if (typeof window !== "undefined") {
  web3Modal = new Web3Modal({
    network: "mainnet",
    cacheProvider: true,
    providerOptions,
  });
}

export const Web3Button = () => {
  const { provider, web3Provider, address } = useStore();

  const resetWeb3State = useStore((state) => state.reset);

  const networkInfo = useNetworkInfo();

  const connect = useCallback(async function () {
    let provider;
    try {
      provider = await web3Modal.connect();
    } catch (e) {
      console.warn("Connection error:", e);
      return;
    }

    provider.on("chainChanged", (chainId) => {
      useStore.setState({ chainId: Number(chainId) });
    });

    const web3Provider = new providers.Web3Provider(provider, "any");
    const signer = web3Provider.getSigner();
    const address = await signer.getAddress();
    const network = await web3Provider.getNetwork();

    // Add contracts
    useStore.setState({
      provider,
      web3Provider,
      address,
      chainId: network.chainId,
    });
  }, []);

  const disconnect = useCallback(
    async function () {
      await web3Modal.clearCachedProvider();
      if (provider?.disconnect && typeof provider.disconnect === "function") {
        await provider.disconnect();
      }
      resetWeb3State();
    },
    [provider, resetWeb3State]
  );

  // Auto connect to the cached provider
  useEffect(() => {
    if (web3Modal.cachedProvider) {
      connect();
    }
  }, [connect]);

  if (!networkInfo.correct) {
    return (
      <button
        className="btn btn-primary btn-error btn-sm rounded-btn"
        onClick={() => {
          toast.error(
            `Please connect to ${
              networkNameMap[networkInfo.envNetwork]
            } network.`,
            {
              hideProgressBar: true,
            }
          );
        }}
      >
        Wrong Network
      </button>
    );
  }
  return web3Provider ? (
    <>
      {address && (
        <span className="text-muted">
          {truncateEthAddress(address)}
          {web3Provider.network.name === "unknown" && " / Localhost"}
          {web3Provider.network.name === "rinkeby" && " / Rinkeby"}
        </span>
      )}
      <button
        className="ml-2 btn btn-primary btn-sm rounded-btn"
        onClick={disconnect}
      >
        Disconnect
      </button>
    </>
  ) : (
    <button className="btn btn-primary btn-sm rounded-btn" onClick={connect}>
      Connect
    </button>
  );
};
