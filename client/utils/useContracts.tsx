import { useEffect, useState } from "react";
import { ethers } from "ethers";
// Note we don't have a Rinkeby deploy of OUSD contracts, so always use mainnet
import OUSDContracts from "networks/network.mainnet.json";
import { mainnetNetworkUrl, RPC_URLS, CHAIN_CONTRACTS } from "constants/index";
import { useStore } from "utils/store";
import { claimIsOpen } from "utils/index";

const useContracts = () => {
  const { web3Provider, chainId } = useStore();

  useEffect(() => {
    const loadContracts = async () => {
      useStore.setState({
        contracts: {
          loaded: false,
        },
      });

      const governanceContractDefinitions = CHAIN_CONTRACTS[chainId];

      // wallet not connected yet
      if (!governanceContractDefinitions) {
        return;
      }

      const mainnetProvider = new ethers.providers.JsonRpcProvider(
        mainnetNetworkUrl
      );
      const networkProvider = new ethers.providers.JsonRpcProvider(
        RPC_URLS[chainId]
      );

      const governanceContracts = Object.entries(
        governanceContractDefinitions
      ).map(([name, definition]) => {
        const contract = new ethers.Contract(
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
            mainnetProvider
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
        contracts,
      });
    };
    if (claimIsOpen()) {
      loadContracts();
    }
  }, [web3Provider, chainId]);
};

export default useContracts;
