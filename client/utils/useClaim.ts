import { useState, useEffect } from "react";
import { useStore } from "utils/store";

const useClaim = () => {
  const [claim, setClaim] = useState({});
  const { address } = useStore();

  useEffect(() => {
    const getClaim = async () => {
      const api = `/api/claim?account=${address}`;
      const res = await fetch(api);

      const claim = await res.json();

      setClaim(claim);
    };

    getClaim();

    return () => setClaim({});
  }, [address]);

  return claim;
};

export default useClaim;
