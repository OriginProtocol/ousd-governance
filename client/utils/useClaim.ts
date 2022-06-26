import { useState, useEffect } from "react";
import { BigNumber } from "ethers";
import { useStore } from "utils/store";

const useClaim = () => {
  const [claim, setClaim] = useState({});
  const { address } = useStore();

  const maybeConvertToBn = (amount) => {
    if (typeof amount !== "object" || !amount || amount.hex === undefined)
      return null;

    return BigNumber.from(amount.hex);
  };

  useEffect(() => {
    const getClaim = async () => {
      const api = `/api/claim?account=${address}`;
      const res = await fetch(api);

      const claim = await res.json();

      claim.amount = maybeConvertToBn(claim.amount);
      if (claim.split) {
        claim.split.ousd = maybeConvertToBn(claim.split.ousd);
        claim.split.wousd = maybeConvertToBn(claim.split.wousd);
      }

      setClaim(claim);
    };

    getClaim();

    return () => setClaim({});
  }, [address]);

  return claim;
};

export default useClaim;
