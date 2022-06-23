import { useEffect, useState } from "react";
import { useStore } from "utils/store";
import { useNetworkInfo, claimIsOpen } from "utils/index";
import moment from "moment";

const useAccountBalances = () => {
  const [reloadAllowances, setReloadAllowances] = useState(0);
  const [reloadBalances, setReloadBalances] = useState(0);

  const networkInfo = useNetworkInfo();
  const { web3Provider, address, contracts } = useStore();

  // Load users governance token balance and vote power
  useEffect(() => {
    const loadOgvBalance = async () => {
      return await contracts.OriginDollarGovernance.balanceOf(address);
    };

    const loadLockedUpOgvBalance = () => 0; // @TODO Total lockup amounts from db for this address

    const loadVeOgvBalance = async () => {
      return await contracts.OgvStaking.balanceOf(address);
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
        loadLockedUpOgvBalance(),
        loadVeOgvBalance(),
        web3Provider.getBlock(),
      ]).then(([ogv, lockedUpOgv, veOgv, lastestBlock]) => {
        const now = lastestBlock.timestamp;

        useStore.setState({
          balances: {
            ogv,
            lockedUpOgv,
            veOgv,
          },
        });
      });
    }
  }, [address, web3Provider, contracts, reloadBalances, networkInfo.correct]);

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
  }, [address, web3Provider, contracts, reloadAllowances, networkInfo.correct]);

  return {
    reloadAllowances: () => {
      setReloadAllowances(reloadAllowances + 1);
    },
    reloadBalances: () => {
      setReloadBalances(reloadBalances + 1);
    },
    reloadAll: () => {
      setReloadAllowances(reloadAllowances + 1);
      setReloadBalances(reloadBalances + 1);
    },
  };
};

export default useAccountBalances;
