import { useEffect, useState } from "react";
import { useStore } from "utils/store";
import { useNetworkInfo, claimIsOpen } from "utils/index";

const useAccountBalances = () => {
  const [reloadAccountAllowances, setReloadAccountAllowances] = useState(0);
  const [reloadAccountBalances, setReloadAccountBalances] = useState(0);

  const networkInfo = useNetworkInfo();
  const { web3Provider, address, contracts } = useStore();

  // Load users governance token balance and vote power
  useEffect(() => {
    const loadOgvBalance = async () => {
      return await contracts.OriginDollarGovernance.balanceOf(address);
    };

    const loadVeOgvBalance = async () => {
      return await contracts.OgvStaking.balanceOf(address);
    };

    const loadAccruedRewards = async () => {
      return await contracts.OgvStaking.previewRewards(address);
    };

    if (
      claimIsOpen() &&
      web3Provider &&
      address &&
      networkInfo.correct &&
      contracts.loaded
    ) {
      Promise.all([
        loadOgvBalance(),
        loadVeOgvBalance(),
        loadAccruedRewards(),
      ]).then(([ogv, veOgv, accruedRewards]) => {
        useStore.setState({
          balances: {
            ogv,
            veOgv,
            accruedRewards,
          },
        });
      });
    }
  }, [
    address,
    web3Provider,
    contracts,
    reloadAccountBalances,
    networkInfo.correct,
  ]);

  useEffect(() => {
    const loadAllowance = async () => {
      return await contracts.OriginDollarGovernance.allowance(
        address,
        contracts.OgvStaking.address
      );
    };

    if (
      claimIsOpen() &&
      web3Provider &&
      address &&
      networkInfo.correct &&
      contracts.loaded
    ) {
      Promise.all([loadAllowance()]).then(([ogv_approval]) => {
        useStore.setState({
          allowances: {
            ogv: ogv_approval,
          },
        });
      });
    }
  }, [
    address,
    web3Provider,
    contracts,
    reloadAccountAllowances,
    networkInfo.correct,
  ]);

  return {
    reloadAccountAllowances: () => {
      setReloadAccountAllowances(reloadAccountAllowances + 1);
    },
    reloadAccountBalances: () => {
      setReloadAccountBalances(reloadAccountBalances + 1);
    },
    reloadAll: () => {
      setReloadAccountAllowances(reloadAccountAllowances + 1);
      setReloadAccountBalances(reloadAccountBalances + 1);
    },
  };
};

export default useAccountBalances;
