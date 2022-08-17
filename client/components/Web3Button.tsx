import WalletConnectProvider from "@walletconnect/web3-provider";
import { MewConnectConnector } from "@myetherwallet/mewconnect-connector";
import { providers, utils } from "ethers";
import { useCallback, useEffect, FunctionComponent } from "react";
import WalletLink from "walletlink";
import Web3Modal from "web3modal";
import { truncateEthAddress, useNetworkInfo } from "utils/index";
import { useStore } from "utils/store";
import {
  RPC_URLS,
  mainnetNetworkUrl,
  websocketProvider,
} from "constants/index";
import { toast } from "react-toastify";
import classNames from "classnames";

const providerOptions = {
  walletconnect: {
    package: WalletConnectProvider, // required
    options: {
      rpc: RPC_URLS,
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
  "custom-mew": {
    display: {
      logo: "/myetherwallet-icon.svg",
      name: "MyEtherWallet",
      description: "Connect to your MyEtherWallet",
    },
    package: MewConnectConnector,
    options: {
      appName: "MyEtherWallet", // Your app name
      networkUrl: mainnetNetworkUrl,
      chainId: 1,
    },
    connector: async () => {
      const connector = new MewConnectConnector({
        url: websocketProvider,
      });
      await connector.activate();
      const provider = await connector.getProvider();
      provider.enable();
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
  useStore.setState({ web3Modal });
}

interface Web3ButtonProps {
  inPage?: Boolean;
}

export const Web3Button: FunctionComponent<Web3ButtonProps> = ({ inPage }) => {
  const { provider, web3Provider, address } = useStore();

  const resetWeb3State = useStore((state) => state.reset);

  const networkInfo = useNetworkInfo();

  const connect = useCallback(
    async function (isAutoconnect = false) {
      if (!isAutoconnect) {
        await web3Modal.clearCachedProvider();
      }
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

      provider.on("accountsChanged", async (accounts) => {
        const newAccount: string =
          accounts.length === 0 ? undefined : accounts[0];
        let storeUpdate = {
          address: utils.getAddress(newAccount), // ensure checksum address to prevent excess state updates
        };
        resetWeb3State();

        if (newAccount !== undefined) {
          storeUpdate = {
            ...storeUpdate,
            provider,
            web3Provider,
            chainId: network.chainId,
          };
        }
        useStore.setState(storeUpdate);
      });

      // Add contracts
      useStore.setState({
        provider,
        web3Provider,
        address,
        chainId: network.chainId,
      });
    },
    [resetWeb3State]
  );

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
      connect(true);
    }
  }, [connect]);

  if (web3Provider && !networkInfo.correct) {
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

  const defaultClassName = classNames("", {
    "btn btn-outline btn-sm border-[#bbc9da] text-white rounded-full text-sm capitalize font-normal hover:bg-white hover:text-secondary":
      !inPage,
    "btn btn-primary btn-lg rounded-full w-full h-[3.25rem] min-h-[3.25rem]":
      inPage,
  });

  return web3Provider ? (
    <div className="dropdown relative">
      {address && (
        <label
          tabIndex={0}
          className="flex items-center space-x-2 p-2 md:px-4 border border-[#bbc9da] text-white rounded-full text-sm leading-none capitalize cursor-pointer"
        >
          <span className="w-3 h-3 bg-[#4bbc8a] rounded-full" />
          <div className="invisible md:visible md:flex">
            {truncateEthAddress(address)}
            {web3Provider.network.name === "unknown" && " / Lh"}
            {web3Provider.network.name === "rinkeby" && " / Rink"}
          </div>
        </label>
      )}
      <div
        tabIndex={0}
        className="dropdown-content absolute top-full mt-3 right-0 bg-white p-3 md:p-4 rounded-xl border shadow-sm w-36 lg:w-full no-animation"
      >
        <button
          className="btn btn-primary btn-sm rounded-btn w-full"
          onClick={disconnect}
        >
          Disconnect
        </button>
      </div>
    </div>
  ) : (
    <button className={defaultClassName} onClick={connect}>
      {inPage ? "Connect wallet" : "Connect"}
    </button>
  );
};
