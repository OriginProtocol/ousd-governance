import { useEffect, useState } from "react";
import { ETHERSCAN_API_KEY } from "../constants";
import { useNetworkInfo } from "utils/index";

const useFutureBlockTime = (blockNumber: Number) => {
  const { envNetwork } = useNetworkInfo();
  const [futureBlockTime, setFutureBlockTime] = useState(0);

  useEffect(() => {
    const fetchFutureBlock = async () => {
      let api = `https://api.etherscan.io/api?module=block&action=getblockcountdown&blockno=${blockNumber}&apikey=${ETHERSCAN_API_KEY}`;
      if (4 === envNetwork) {
        api = `https://api-rinkeby.etherscan.io/api?module=block&action=getblockcountdown&blockno=${blockNumber}&apikey=${ETHERSCAN_API_KEY}`;
      }
      const res = await fetch(api);
      const futureBlock = await res.json();
      if (futureBlock?.status !== "0") {
        setFutureBlockTime(futureBlock?.result?.EstimateTimeInSec);
      }
    };

    if (ETHERSCAN_API_KEY && blockNumber) {
      fetchFutureBlock();
    }
  }, [envNetwork, blockNumber]);

  return futureBlockTime;
};

export { useFutureBlockTime };
