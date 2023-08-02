import { useEffect, useState } from "react";
import { useStore } from "utils/store";
import { useNetworkInfo } from "utils/index";
import { useAccount } from "wagmi";

const useBlock = () => {
  const networkInfo = useNetworkInfo();
  const { isConnected } = useAccount();
  const { provider } = useStore();
  const [refetchBlock, setRefetchBlock] = useState(0);

  useEffect(() => {
    const getBlockTimestamp = async () => {
      const currentBlock = await provider?.getBlockNumber();
      const block = await provider?.getBlock(currentBlock);
      return block?.timestamp;
    };

    let intervalId: ReturnType<typeof setInterval>;

    if (isConnected && networkInfo.correct) {
      intervalId = setInterval(() => {
        Promise.all([getBlockTimestamp()]).then(([blockTimestamp]) => {
          useStore.setState({
            blockTimestamp,
          });
        });
      }, 4000);
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
