import { ethers } from "ethers";
import { useEffect } from "react";
import "../styles/globals.css";

import Layout from "../components/layout";
// Note we don't have a Rinkeby deploy of OUSD contracts, so always use mainnet
import OUSDContracts from "networks/network.mainnet.json";
import { mainnetNetworkUrl, RPC_URLS, CHAIN_CONTRACTS } from "constants/index";
import { useStore } from "utils/store";
import useAccountBalances from "utils/useAccountBalances";
import { TransactionListener } from "components/TransactionListener";

export default function App({ Component, pageProps }) {
  const { web3Provider, contracts, chainId } = useStore();
  useAccountBalances();

  useEffect(() => {
    const loadContracts = async () => {
      useStore.setState({
        contracts: {
          loaded: false,
        },
      });
      const mainnetProvider = new ethers.providers.JsonRpcProvider(
        mainnetNetworkUrl
      );
      const networkProvider = new ethers.providers.JsonRpcProvider(
        RPC_URLS[chainId]
      );

      let signer;
      if (web3Provider) {
        signer = await web3Provider.getSigner();
      }

      const provider = web3Provider || networkProvider;
      const governanceContractDefinitions = CHAIN_CONTRACTS[chainId];
      const governanceContracts = Object.entries(
        governanceContractDefinitions
      ).map(([name, definition]) => {
        return {
          [name]: {
            ...new ethers.Contract(
              definition.address,
              definition.abi,
              signer || provider
            ),
            abi: definition.abi,
          },
        };
      });

      const ousdContracts = Object.entries(OUSDContracts.contracts).map(
        ([name, definition]) => {
          return {
            [name]: {
              ...new ethers.Contract(
                definition.address,
                definition.abi,
                // This has to be mainnet, as we are using mainnet OUSD contracts, even in testing
                mainnetProvider
              ),
              abi: definition.abi,
            },
          };
        }
      );

      const contracts = Object.assign(
        ...ousdContracts.concat(governanceContracts)
      );

      contracts.loaded = true;
      useStore.setState({
        contracts,
      });
    };
    loadContracts();
  }, [web3Provider, chainId]);

  if (Object.keys(contracts).length === 0) {
    return <div>Loading...</div>;
  }

  return (
    <Layout>
      <Component {...pageProps} />
      <TransactionListener />
    </Layout>
  );
}
