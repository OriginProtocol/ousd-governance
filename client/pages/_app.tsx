import { ethers } from "ethers";
import { useEffect } from "react";
import "../styles/globals.css";

import Layout from "../components/layout";
//
// Note we don't have a Rinkeby deploy of OUSD contracts, so always use mainnet
import OUSDContracts from "networks/network.mainnet.json";
import LocalGovernanceContracts from "networks/governance.localhost.json";
import RinkebyGovernanceContracts from "networks/governance.rinkeby.json";
import MainnetGovernanceContracts from "networks/governance.mainnet.json";
import { INFURA_ID, mainnetNetworkUrl } from "components/Web3Button";
import { useStore } from "utils/store";

const rinkebyNetworkUrl =
  "https://eth-rinkeby.alchemyapi.io/v2/i4XEfcs5ZohhedGPYPK72GBrz6mBpjAP";

const RPC_URLS = {
  1: mainnetNetworkUrl,
  4: rinkebyNetworkUrl,
  31337: "http://localhost:8545",
};

const CHAIN_CONTRACTS = {
  1: MainnetGovernanceContracts,
  4: RinkebyGovernanceContracts,
  31337: LocalGovernanceContracts,
};

const chainId = process.env.NEXT_PUBLIC_NETWORK_ID || 31337;
const mainnetProvider = new ethers.providers.JsonRpcProvider(mainnetNetworkUrl);
const networkProvider = new ethers.providers.JsonRpcProvider(RPC_URLS[chainId]);

export default function App({ Component, pageProps }) {
  const { provider, web3Provider, address, contracts } = useStore();

  const resetWeb3State = useStore((state) => state.reset);
  useEffect(() => {
    const loadContracts = async () => {
      const provider = web3Provider || networkProvider;
      const governanceContractDefinitions = CHAIN_CONTRACTS[chainId];
      const governanceContracts = Object.entries(
        governanceContractDefinitions
      ).map(([name, definition]) => {
        return {
          [name]: new ethers.Contract(
            definition.address,
            definition.abi,
            provider
          ),
        };
      });

      const ousdContracts = Object.entries(OUSDContracts.contracts).map(
        ([name, definition]) => {
          return {
            [name]: new ethers.Contract(
              definition.address,
              definition.abi,
              // This has to be mainnet, as we are using mainnet OUSD contracts, even in testing
              mainnetProvider
            ),
          };
        }
      );

      const contracts = Object.assign(
        ...ousdContracts.concat(governanceContracts)
      );
      useStore.setState({
        contracts,
      });
    };
    loadContracts();
  }, [web3Provider]);

  if (Object.keys(contracts).length === 0) {
    return <div>Loading...</div>;
  }

  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}
