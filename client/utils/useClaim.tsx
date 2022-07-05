import { useState, useEffect } from "react";
import { BigNumber } from "ethers";
import { useStore } from "utils/store";
import useConnectSigner from "utils/useConnectSigner";
import { decimal18Bn } from "utils";
import numeral from "numeraljs";

const useClaim = () => {
  const emptyClaimState = {
    optional: { hasClaim: false },
    mandatory: { hasClaim: false },
  };
  const [claim, setClaim] = useState(emptyClaimState);
  const [loaded, setLoaded] = useState(false);
  const [distributorData, setDistributorData] = useState({});
  const [totalSupplyVeOgv, setTotalSupplyVeOgv] = useState(null);
  const [totalSupplyVeOgvAdjusted, setTotalSupplyVeOgvAdjusted] =
    useState(null);
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

  useEffect(() => {
    const loadTotalSupplyVeOGV = async () => {
      if (!contracts.loaded) {
        return;
      }
      try {
        const totalSupplyBn = await contracts.OgvStaking.totalSupply();
        setTotalSupplyVeOgv(totalSupplyBn);
        // TODO: verify this that we need to set some minimal total supply. Otherwise the first couple
        // of claimers will see insane reward amounts
        const minTotalSupply = numeral(100000000); // 100m of OGV
        const totalSupply = numeral(totalSupplyBn.div(decimal18Bn).toString());
        setTotalSupplyVeOgvAdjusted(Math.max(totalSupply, minTotalSupply));
      } catch (error) {
        console.error(`Can not fetch veOgv total supply:`, error);
      }
    };
    loadTotalSupplyVeOGV();
  }, [contracts]);

  return {
    optional: {
      ...claim.optional,
      ...distributorData.optional,
    },
    mandatory: {
      ...claim.mandatory,
      ...distributorData.mandatory,
    },
    staking: {
      // total supply adjusted for APY, with min amount - type: numeral
      totalSupplyVeOgvAdjusted: totalSupplyVeOgvAdjusted,
      // actual totalSupply - type: BigNumber
      totalSupplyVeOgv: totalSupplyVeOgv,
    },
    hasClaim,
    loaded,
  };
};

export default useClaim;
