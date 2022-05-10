import { useEffect, useState } from "react";
import { useStore } from "utils/store";
import { useNetworkInfo } from "utils/index";

const useTotalBalances = () => {
  const networkInfo = useNetworkInfo();
  const { web3Provider, contracts } = useStore();

  useEffect(() => {
    const loadTotalSupply = async () =>
      await contracts.OriginDollarGovernance.totalSupply();

    if (web3Provider && networkInfo.correct && contracts.loaded) {
      Promise.all([loadTotalSupply()]).then(([totalSupply]) => {
        useStore.setState({
          totalBalances: {
            totalSupply,
          },
        });
      });
    }
  }, [networkInfo, web3Provider, contracts]);
};

export default useTotalBalances;
