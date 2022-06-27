import { useState, useEffect } from "react";
import { BigNumber } from "ethers";
import { useStore } from "utils/store";
import useConnectSigner from "utils/useConnectSigner";

const useClaim = () => {
  const [claim, setClaim] = useState({ hasClaim: false });
  const [loaded, setLoaded] = useState(false);
  const [distributorData, setDistributorData] = useState({});
  const { address, contracts, web3Provider } = useStore();

  const maybeConvertToBn = (amount) => {
    if (typeof amount !== "object" || !amount || amount.hex === undefined)
      return null;

    return BigNumber.from(amount.hex);
  };

  useEffect(() => {
    const getClaim = async () => {
      setLoaded(false);
      const api = `/api/claim?account=${address}`;
      const res = await fetch(api);

      const claim = await res.json();

      if (claim.hasClaim) {
        claim.amount = maybeConvertToBn(claim.amount);
        if (claim.split) {
          claim.split.ousd = maybeConvertToBn(claim.split.ousd);
          claim.split.wousd = maybeConvertToBn(claim.split.wousd);
        }
      } else {
        // nothing else to fetch related to claims.
        setLoaded(true);
      }

      setClaim(claim);
    };

    getClaim();

    return () => setClaim({ hasClaim: false });
  }, [address]);

  useEffect(() => {
    if (!contracts.loaded || !claim.hasClaim) {
      return;
    }

    const readDistributor = async (distContract) => {
      return {
        isClaimed: await distContract.isClaimed(claim.index),
        isValid: await distContract.isProofValid(
          claim.index,
          claim.amount,
          claim.proof
        ),
      };
    };

    setDistributorData({});
    setLoaded(false);

    Promise.all([
      readDistributor(contracts.OptionalDistributor),
      readDistributor(contracts.MandatoryDistributor),
    ])
      .then(([optional, mandatory]) => {
        setDistributorData({
          optional: {
            ...optional,
            claim: async (duration) => {
              const durationTime = BigNumber.from(duration)
                .mul(24)
                .mul(60)
                .mul(60)
                .mul(7);
              return (
                await useConnectSigner(
                  contracts.OptionalDistributor,
                  web3Provider
                )
              )["claim(uint256,uint256,bytes32[],uint256)"](
                claim.index,
                claim.amount,
                claim.proof,
                durationTime
              );
            },
          },
          mandatory: {
            ...mandatory,
            claim: async () => {
              return (
                await useConnectSigner(
                  contracts.MandatoryDistributor,
                  web3Provider
                )
              )["claim(uint256,uint256,bytes32[])"](
                claim.index,
                claim.amount,
                claim.proof
              );
            },
          },
        });
        setLoaded(true);
      })
      .catch((error) => {
        console.log("Error fetching contract distribution state:", error);
      });
  }, [address, contracts.loaded, claim, web3Provider]);

  //console.log("DIST DATA", claim, distributorData);
  return {
    claimData: claim,
    ...distributorData,
    loaded,
  };
};

export default useClaim;
