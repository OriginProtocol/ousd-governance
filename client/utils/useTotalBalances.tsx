import { useEffect, useState } from "react";
import { useStore } from "utils/store";
import { useNetworkInfo } from "utils/index";

const useTotalBalances = () => {
  const networkInfo = useNetworkInfo();
  const { web3Provider, contracts } = useStore();

  useEffect(() => {
    const loadTotalSupplyOfOgv = async () =>
      await contracts.OriginDollarGovernance.totalSupply();

    const loadTotalLockedUpOgv = async () =>
      await contracts.OriginDollarGovernance.balanceOf(
        contracts.OgvStaking.address
      );

    if (web3Provider && networkInfo.correct && contracts.loaded) {
      Promise.all([loadTotalSupplyOfOgv(), loadTotalLockedUpOgv()]).then(
        ([totalSupplyOfOgv, totalLockedUpOgv]) => {
          useStore.setState({
            totalBalances: {
              totalSupplyOfOgv,
              totalLockedUpOgv,
            },
          });
        }
      );
    }
  }, [networkInfo, web3Provider, contracts]);
};

export default useTotalBalances;
