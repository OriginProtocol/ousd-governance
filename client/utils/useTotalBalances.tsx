import { useEffect, useState } from "react";
import { useStore } from "utils/store";
import { useNetworkInfo, claimIsOpen } from "utils/index";
import numeral from "numeraljs";
import { decimal18Bn } from "utils";

const useTotalBalances = () => {
  const networkInfo = useNetworkInfo();
  const { contracts } = useStore();

  const [reloadTotalBalances, setReloadTotalBalances] = useState(0);

  useEffect(() => {
    const loadTotalSupplyOfOgv = async () =>
      await contracts.OriginDollarGovernance.totalSupply();

    const loadTotalLockedUpOgv = async () =>
      await contracts.OriginDollarGovernance.balanceOf(
        contracts.OgvStaking.address
      );

    const loadTotalSupplyVeOgv = async () =>
      await contracts.OgvStaking.totalSupply();

    if (claimIsOpen() && contracts.loaded) {
      Promise.all([
        loadTotalSupplyOfOgv(),
        loadTotalLockedUpOgv(),
        loadTotalSupplyVeOgv(),
      ]).then(([totalSupplyOfOgv, totalLockedUpOgv, totalSupplyVeOgv]) => {
        const totalPercentageOfLockedUpOgv =
          totalLockedUpOgv.gt(0) && totalSupplyOfOgv.gt(0)
            ? (totalLockedUpOgv / totalSupplyOfOgv) * 100
            : 0;

        const minTotalSupply = numeral(100000000);
        const totalSupply = numeral(
          totalSupplyVeOgv.div(decimal18Bn).toString()
        );

        useStore.setState({
          totalBalances: {
            totalSupplyOfOgv,
            totalLockedUpOgv,
            totalPercentageOfLockedUpOgv,
            totalSupplyVeOgv,
            totalSupplyVeOgvAdjusted: Math.max(totalSupply, minTotalSupply),
          },
        });
      });
    }
  }, [networkInfo.correct, contracts, reloadTotalBalances]);

  return {
    reloadTotalBalances: () => {
      setReloadTotalBalances(reloadTotalBalances + 1);
    },
  };
};

export default useTotalBalances;
