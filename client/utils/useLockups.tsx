import { useEffect, useState } from "react";
import { useStore } from "utils/store";
import { useNetworkInfo, claimIsOpen } from "utils/index";
import { fetcher } from "utils/index";
import useSWR, { mutate } from "swr";
import { ethers } from "ethers";

const useLockups = () => {
  const [reloadLockups, setReloadLockups] = useState(0);

  const networkInfo = useNetworkInfo();
  const { web3Provider, address, contracts } = useStore();

  const { data } = useSWR(`/api/lockups?account=${address}`, fetcher);
  // @TODO: Might need to fetch data another way as it doesn't reload instantly using set reloadLockups

  useEffect(() => {
    const loadLockups = async () => {
      return Promise.all(
        data?.lockups.map((lockup) => {
          const lockupCall = contracts.OgvStaking.lockups(
            address,
            lockup.lockupId
          );

          return Promise.all([lockupCall]).then((lockupOnChain) => {
            const enrichedLockup = {
              ...lockup,
              amount: lockupOnChain[0].amount,
              end: lockupOnChain[0].end,
              points: lockupOnChain[0].points,
            };

            return enrichedLockup;
          });
        })
      ).then((enrichedLockups) => {
        useStore.setState({
          lockups: enrichedLockups,
        });
      });
    };

    /*const loadLockups1 = async () => {
      const lockupIds = data?.lockups.map((lockup) => lockup.lockupId);
      const lockupCalls = lockupIds.map(
        async (id) => await contracts.OgvStaking.lockups(address, id)
      );

      Promise.all(lockupCalls).then((lockups) => {
        const lockupAmounts = lockups.map((lockup) => lockup.amount);

        const totalOgvLockedUp = lockupAmounts.reduce(
          (total: ethers.BigNumber, amount) => {
            return total.add(amount);
          },
          ethers.BigNumber.from("0")
        );

        useStore.setState({
          lockups,
          totalOgvLockedUp,
        });
      });
    };*/

    if (
      claimIsOpen() &&
      web3Provider &&
      networkInfo.correct &&
      address &&
      contracts.loaded &&
      data?.lockups.length > 0
    ) {
      loadLockups();
    }
  }, [web3Provider, networkInfo.correct, address, data, contracts]);

  return {
    reloadLockups: async () => {
      setReloadLockups(reloadLockups + 1);
      await mutate(`/api/lockups?account=${address}`);
    },
  };
};

export default useLockups;
