import { useEffect, useState } from "react";
import { useStore } from "utils/store";
import { useNetworkInfo } from "utils/index";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import { RPC_URLS } from "@/constants/index";

const useBlock = () => {
  const networkInfo = useNetworkInfo();
  const { isConnected } = useAccount();
  const [refetchBlock, setRefetchBlock] = useState(0);

  useEffect(() => {
    const getBlockTimestamp = async () => {
      const provider = new ethers.providers.JsonRpcProvider(
        RPC_URLS[networkInfo.envNetwork]
      );
      const currentBlock = await provider?.getBlockNumber();
      const block = await provider?.getBlock(currentBlock);
      return block?.timestamp;
    };

    let intervalId: ReturnType<typeof setInterval>;

    const pullTimestamp = () => {
      Promise.all([getBlockTimestamp()]).then(([blockTimestamp]) => {
        useStore.setState({
          blockTimestamp,
        });
      });
    };

    if (isConnected && networkInfo.correct) {
      intervalId = setInterval(pullTimestamp, 4000);
    }

    return () => clearInterval(intervalId);
  }, [isConnected, networkInfo.correct, networkInfo.envNetwork, refetchBlock]);

  return {
    refetchBlock: () => {
      setRefetchBlock(refetchBlock + 1);
    },
  };
};

export default useBlock;
