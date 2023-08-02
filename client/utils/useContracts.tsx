import { useEffect } from "react";
import { ethers } from "ethers";
import OUSDContracts from "networks/network.mainnet.json";
import { CHAIN_CONTRACTS, mainnetNetworkUrl, RPC_URLS } from "constants/index";
import { useStore } from "utils/store";
import { useNetworkInfo } from "utils/index";
import { useAccount, useNetwork, useSigner } from "wagmi";

const useContracts = () => {
  const { isConnected } = useAccount();
  const { data: signer } = useSigner();
  const { chain } = useNetwork();
  const chainId = chain?.id;
  const networkInfo = useNetworkInfo();

  useEffect(() => {
    const provider = new ethers.providers.JsonRpcProvider(
      RPC_URLS[networkInfo.envNetwork]
    );

    const loadContracts = async () => {
      useStore.setState({
        contracts: {
          loaded: false,
        },
      });

      const governanceContractDefinitions =
        CHAIN_CONTRACTS[networkInfo.envNetwork];

      const governanceContracts = Object.entries(
        governanceContractDefinitions
      ).map(([name, definition]) => {
        const contract = new ethers.Contract(
          definition.address,
          definition.abi,
          signer || provider
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
            provider
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
        rpcProvider: provider,
        contracts,
      });
    };

    loadContracts();
  }, [isConnected, chainId, networkInfo.envNetwork]);
};

export default useContracts;
