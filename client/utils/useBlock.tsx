import { useEffect, useState } from "react";
import { useStore } from "utils/store";
import { useNetworkInfo } from "utils/index";
import { Timer } from "";

const useBlock = () => {
  const networkInfo = useNetworkInfo();
  const { web3Provider } = useStore();

  const [refetchBlock, setRefetchBlock] = useState(0);

  useEffect(() => {
    const getBlockTimestamp = async () => {
      const currentBlock = await web3Provider?.getBlockNumber();
      const block = await web3Provider?.getBlock(currentBlock);

      return block?.timestamp;
    };

    let intervalId: ReturnType<typeof setInterval>;

    if (web3Provider && networkInfo.correct) {
      intervalId = setInterval(() => {
        Promise.all([getBlockTimestamp()]).then(([blockTimestamp]) => {
          useStore.setState({
            blockTimestamp,
          });
        });
      }, 4000);
    }

    return () => clearInterval(intervalId);
  }, [web3Provider, networkInfo.correct, refetchBlock]);

  return {
    refetchBlock: () => {
      setRefetchBlock(refetchBlock + 1);
    },
  };
};

export default useBlock;
