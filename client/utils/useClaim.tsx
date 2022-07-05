import { useState, useEffect } from "react";
import { BigNumber } from "ethers";
import { useStore } from "utils/store";
import useConnectSigner from "utils/useConnectSigner";

const useClaim = () => {
  const emptyClaimState = {
    optional: { hasClaim: false },
    mandatory: { hasClaim: false },
  };
  const [claim, setClaim] = useState(emptyClaimState);
  const [loaded, setLoaded] = useState(false);
  const [distributorData, setDistributorData] = useState({});
  const { address, contracts, web3Provider } = useStore();
  const hasClaim = claim.optional.hasClaim || claim.mandatory.hasClaim;

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

      if (!claim.optional.hasClaim && !claim.mandatory.hasClaim) {
        // nothing else to fetch related to claims.
        setLoaded(true);
      } else {
        const transformClaim = (claim) => {
          claim.amount = maybeConvertToBn(claim.amount);
          Object.keys(claim.split).map((key) => {
            claim.split[key] = maybeConvertToBn(claim.split[key]);
          });

          return claim;
        };

        claim.optional = transformClaim(claim.optional);
        claim.mandatory = transformClaim(claim.mandatory);
      }

      setClaim(claim);
    };

    getClaim();

    return () => setClaim(emptyClaimState);
  }, [address]);

  useEffect(() => {
    if (
      !contracts.loaded ||
      !(claim.optional.hasClaim || claim.mandatory.hasClaim)
    ) {
      return;
    }

    const readDistributor = async (distContract, claim) => {
      return {
        isClaimed: await distContract.isClaimed(claim.index),
        isValid: await distContract.isProofValid(
          claim.index,
          claim.amount,
          address,
          claim.proof
        ),
      };
    };

    setDistributorData({});
    setLoaded(false);

    const setupDistributors = async () => {
      try {
        const distData = {};

        if (claim.optional.hasClaim) {
          let distributor = await readDistributor(
            contracts.OptionalDistributor,
            claim.optional
          );

          distData.optional = {
            ...distributor,
            claim: async (duration) => {
              // the duration for the stake is in seconds
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
                claim.optional.index,
                claim.optional.amount,
                claim.optional.proof,
                durationTime,
                { gasLimit: 1000000 } // @TODO maybe set this to lower amount
              );
            },
          };
        }

        if (claim.mandatory.hasClaim) {
          let distributor = await readDistributor(
            contracts.MandatoryDistributor,
            claim.mandatory
          );

          distData.mandatory = {
            ...distributor,
            claim: async () => {
              return (
                await useConnectSigner(
                  contracts.MandatoryDistributor,
                  web3Provider
                )
              )["claim(uint256,uint256,bytes32[])"](
                claim.mandatory.index,
                claim.mandatory.amount,
                claim.mandatory.proof,
                { gasLimit: 1000000 }
              ); // @TODO maybe set this to lower
            },
          };
        }

        setLoaded(true);
        setDistributorData(distData);
      } catch (error) {
        console.error("Error fetching contract distribution state:", error);
      }
    };

    setupDistributors();
  }, [address, contracts, claim, web3Provider]);

  return {
    optional: {
      ...claim.optional,
      ...distributorData.optional,
    },
    mandatory: {
      ...claim.mandatory,
      ...distributorData.mandatory,
    },
    hasClaim,
    loaded,
  };
};

export default useClaim;
