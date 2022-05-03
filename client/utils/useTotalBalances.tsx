import { useEffect, useState } from "react";
import { useStore } from "utils/store";
import { useNetworkInfo } from "utils/index";

const useTotalBalances = () => {
  const networkInfo = useNetworkInfo();
  const { web3Provider, address, contracts } = useStore();

  useEffect(() => {
    const loadTotalSupply = async () =>
      await contracts.OriginDollarGovernance.totalSupply();
    const loadLockedUpSupply = async () =>
      await contracts.VoteLockerCurve.balanceOf(address);

    if (web3Provider && address && networkInfo.correct && contracts.loaded) {
      Promise.all([loadTotalSupply(), loadLockedUpSupply()]).then(
        ([totalSupply, lockedUpSupply]) => {
          useStore.setState({
            totalBalances: {
              totalSupply,
              lockedUpSupply,
            },
          });
        }
      );
    }
  }, [networkInfo, web3Provider, address, contracts]);
};

export default useTotalBalances;
