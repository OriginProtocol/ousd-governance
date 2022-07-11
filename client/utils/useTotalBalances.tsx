import { useEffect, useState } from "react";
import { useStore } from "utils/store";
import { useNetworkInfo, claimIsOpen } from "utils/index";

const useTotalBalances = () => {
  const networkInfo = useNetworkInfo();
  const { web3Provider, contracts } = useStore();

  const [reloadTotalBalances, setReloadTotalBalances] = useState(0);

  useEffect(() => {
    const loadTotalSupplyOfOgv = async () =>
      await contracts.OriginDollarGovernance.totalSupply();

    const loadTotalLockedUpOgv = async () =>
      await contracts.OriginDollarGovernance.balanceOf(
        contracts.OgvStaking.address
      );

    if (
      claimIsOpen() &&
      web3Provider &&
      networkInfo.correct &&
      contracts.loaded
    ) {
      Promise.all([loadTotalSupplyOfOgv(), loadTotalLockedUpOgv()]).then(
        ([totalSupplyOfOgv, totalLockedUpOgv]) => {
          const totalPercentageOfLockedUpOgv =
            totalLockedUpOgv.gt(0) && totalSupplyOfOgv.gt(0)
              ? (totalLockedUpOgv / totalSupplyOfOgv) * 100
              : 0;
          useStore.setState({
            totalBalances: {
              totalSupplyOfOgv,
              totalLockedUpOgv,
              totalPercentageOfLockedUpOgv,
            },
          });
        }
      );
    }
  }, [web3Provider, networkInfo.correct, contracts, reloadTotalBalances]);

  return {
    reloadTotalBalances: () => {
      setReloadTotalBalances(reloadTotalBalances + 1);
    },
  };
};

export default useTotalBalances;
