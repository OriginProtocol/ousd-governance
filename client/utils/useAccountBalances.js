import { ethers } from "ethers";
import { useEffect, useState } from "react";
import { useStore } from "utils/store";
import { useNetworkInfo } from "utils/index";
import moment from "moment";

const useAccountBalances = () => {
  const [reloadAllowances, setReloadAllowances] = useState(0);
  const [reloadBalances, setReloadBalances] = useState(0);

  const networkInfo = useNetworkInfo();
  const { web3Provider, address, contracts } = useStore();

  // Load users governance token balance and vote power
  useEffect(() => {
    const loadBalance = async () => {
      return await contracts.OriginDollarGovernance.balanceOf(address);
    };

    const loadVotePower = async () => {
      return await contracts.VoteLockerCurve.balanceOf(address);
    };

    const loadExistingLockup = async () => {
      const lockup = await contracts.VoteLockerCurve.getLockup(address);
      return {
        amount: lockup[0],
        end: lockup[1],
      };
    };

    if (web3Provider && address && networkInfo.correct && contracts.loaded) {
      Promise.all([
        loadBalance(),
        loadVotePower(),
        loadExistingLockup(),
        web3Provider.getBlock(),
      ]).then(([ogv, vote_power, existingLockup, lastestBlock]) => {
        const now = lastestBlock.timestamp;

        useStore.setState({
          balances: {
            ogv,
            vote_power,
          },
          existingLockup: {
            ...existingLockup,
            existingEndWeeks: !existingLockup.end.eq(ethers.BigNumber.from(0))
              ? existingLockup.end.sub(now).div(604800).toNumber()
              : 0,
            existingEndDate: moment(existingLockup.end.toNumber() * 1000).format("MMM D, YYYY"),
          },
        });
      });
    }
  }, [address, web3Provider, contracts, reloadBalances, networkInfo.correct]);

  useEffect(() => {
    const loadAllowance = async () => {
      return await contracts.OriginDollarGovernance.allowance(
        address,
        contracts.VoteLockerCurve.address
      );
    };

    if (web3Provider && address && networkInfo.correct && contracts.loaded) {
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
