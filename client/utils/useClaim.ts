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
        if (claim.mandatoryLockupClaim) {
          claim.mandatoryLockupClaim.amount = maybeConvertToBn(
            claim.mandatoryLockupClaim.amount
          );
          if (claim.mandatoryLockupClaim.split) {
            claim.mandatoryLockupClaim.split.ousd = maybeConvertToBn(
              claim.mandatoryLockupClaim.split.ousd
            );
            claim.mandatoryLockupClaim.split.wousd = maybeConvertToBn(
              claim.mandatoryLockupClaim.split.wousd
            );
          }
        }
        if (claim.optionalLockupClaim) {
          claim.optionalLockupClaim.amount = maybeConvertToBn(
            claim.optionalLockupClaim.amount
          );
          if (claim.optionalLockupClaim.split) {
            claim.optionalLockupClaim.split.ousd = maybeConvertToBn(
              claim.optionalLockupClaim.split.ousd
            );
            claim.optionalLockupClaim.split.wousd = maybeConvertToBn(
              claim.optionalLockupClaim.split.wousd
            );
          }
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

    const readDistributor = async (distContract, currentClaim) => {
      return {
        isClaimed: await distContract.isClaimed(currentClaim.index),
        isValid: await distContract.isProofValid(
          currentClaim.index,
          currentClaim.amount,
          address,
          currentClaim.proof
        ),
      };
    };

    setDistributorData({});
    setLoaded(false);

    Promise.all([
      readDistributor(contracts.OptionalDistributor, claim.optionalLockupClaim),
      readDistributor(
        contracts.MandatoryDistributor,
        claim.mandatoryLockupClaim
      ),
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
                durationTime,
                { gasLimit: 1000000 }
              ); // @TODO maybe set this to lower
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
                claim.proof,
                { gasLimit: 1000000 }
              ); // @TODO maybe set this to lower
            },
          },
        });
        setLoaded(true);
      })
      .catch((error) => {
        console.log("Error fetching contract distribution state:", error);
      });
  }, [address, contracts, claim, web3Provider]);

  //console.log("DIST DATA", claim, distributorData);
  return {
    claimData: claim,
    ...distributorData,
    loaded,
  };
};

export default useClaim;
