import { useEffect, useState } from "react";
import { ethers } from "ethers";
// Note we don't have a Goerli deploy of OUSD contracts, so always use mainnet
import OUSDContracts from "networks/network.mainnet.json";
import { mainnetNetworkUrl, RPC_URLS, CHAIN_CONTRACTS } from "constants/index";
import { useStore } from "utils/store";
import { useNetworkInfo } from "utils/index";
import { useWeb3React } from "@web3-react/core";

const useContracts = () => {
  const { chainId } = useWeb3React();
  const networkInfo = useNetworkInfo();

  useEffect(() => {
    const loadContracts = async () => {
      useStore.setState({
        contracts: {
          loaded: false,
        },
      });

      const governanceContractDefinitions =
        CHAIN_CONTRACTS[networkInfo.envNetwork];

      const networkProvider = new ethers.providers.JsonRpcProvider(
        RPC_URLS[networkInfo.envNetwork]
      );
      const governanceContracts = Object.entries(
        governanceContractDefinitions
      ).map(([name, definition]) => {
        let contract = new ethers.Contract(
          definition.address,
          definition.abi,
          networkProvider
        );
        return {
          [name]: contract,
        };
      });

      const ousdContracts = Object.entries(OUSDContracts.contracts).map(
        ([name, definition]) => {
          const contract = new ethers.Contract(
            definition.address,
            definition.abi,
            networkProvider
          );
          return {
            [name]: contract,
          };
        }
      );

      const contracts = Object.assign(
        ...ousdContracts.concat(governanceContracts)
      );

      contracts.loaded = true;
      useStore.setState({
        web3Provider: networkProvider,
        contracts,
      });
    };
    loadContracts();
  }, [chainId, networkInfo.envNetwork]);
};

export default useContracts;
