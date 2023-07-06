import { useEffect, useMemo, useState } from "react";
import { SECONDS_IN_A_MONTH } from "constants/index";
import { useStore } from "utils/store";
import { getRewardsApy } from "./apy";
import { ethers } from "ethers";

const useStakingAPY = (amountStaked, duration) => {
  const { contracts, totalBalances } = useStore();

  const [loading, setLoading] = useState(true);
  const [veOgvReceived, setVeOGVReceived] = useState(0);

  const { totalSupplyVeOgvAdjusted } = totalBalances;

  useEffect(() => {
    if (!contracts.loaded) return;

    let done = false;

    async function go() {
      try {
        const [val] = await contracts.OgvStaking.previewPoints(
          ethers.utils.parseEther(amountStaked.toString()),
          duration * SECONDS_IN_A_MONTH
        );

        if (!done) {
          setVeOGVReceived(parseFloat(ethers.utils.formatEther(val)));
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to fetch APY", err);
      }
    }

    go();

    return () => {
      done = true;
    };
  }, [amountStaked, duration, contracts.loaded]);

  const stakingAPY = useMemo(() => {
    if (!veOgvReceived || !totalSupplyVeOgvAdjusted || !amountStaked) {
      return 0;
    }

    return getRewardsApy(veOgvReceived, amountStaked, totalSupplyVeOgvAdjusted);
  }, [veOgvReceived, amountStaked, totalSupplyVeOgvAdjusted]);

  return {
    loading,
    veOgvReceived,
    stakingAPY,
  };
};

export default useStakingAPY;
