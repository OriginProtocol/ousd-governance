import { FunctionComponent, useCallback } from "react";
import Image from "next/image";
import { SectionTitle } from "components/SectionTitle";
import Card from "components/Card";
import { Web3Button } from "components/Web3Button";
import Button from "components/Button";
import { useStore } from "utils/store";
import { truncateEthAddress } from "utils/index";
import useClaim from "utils/useClaim";
import EligibilityItem from "components/claim/EligibilityItem";

interface EligibilityProps {
  handleNextStep: () => void;
}

const Eligibility: FunctionComponent<EligibilityProps> = ({
  handleNextStep,
}) => {
  const { provider, web3Provider, address, web3Modal } = useStore();
  const claim = useClaim();
  const isEligible =
    claim.loaded && (claim.optional.hasClaim || claim.mandatory.hasClaim);
  const claimValid =
    (isEligible && claim.optional && claim.optional.isValid) ||
    (claim.mandatory && claim.mandatory.isValid);

  const resetWeb3State = useStore((state) => state.reset);

  const handleDisconnect = useCallback(
    async function () {
      await web3Modal.clearCachedProvider();
      if (provider?.disconnect && typeof provider.disconnect === "function") {
        await provider.disconnect();
      }
      resetWeb3State();
    },
    [web3Modal, provider, resetWeb3State]
  );

  const canAdvance = web3Provider && isEligible;

  return (
    <>
      <Card>
        <div>
          <SectionTitle>Check Your Eligibility</SectionTitle>
          {!web3Provider ? (
            <>
              <p className="text-sm text-gray-600">
                Connect your wallet below to learn if you&apos;re eligible to
                claim.
              </p>
              <div className="pt-6">
                <Web3Button inPage />
              </div>
            </>
          ) : (
            <>
              {isEligible ? (
                <>
                  {claimValid ? (
                    <div className="bg-accent text-white font-bold px-2 py-4 text-center text-lg">
                      <p className="">
                        {truncateEthAddress(address)} is eligible to claim!
                      </p>
                    </div>
                  ) : (
                    <div className="bg-orange-500 text-white font-bold px-2 py-4 text-center text-lg">
                      <p className="">
                        {truncateEthAddress(address)} has an invalid claim
                        proof!
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="bg-gray-500 text-white font-bold px-2 py-4 text-center text-lg">
                    <p className="">
                      Unfortunately, {truncateEthAddress(address)} isn&apos;t
                      eligible to claim
                    </p>
                  </div>
                </>
              )}
              <div className="mt-2">
                <button
                  className="text-sm text-gray-500 underline ml-auto block"
                  onClick={handleDisconnect}
                >
                  Try another address
                </button>
              </div>
            </>
          )}
          {isEligible && (
            <table className="table w-full mt-6">
              <thead>
                <tr>
                  <th>Eligibility Criteria</th>
                  <th>Tokens</th>
                </tr>
              </thead>
              <tbody>
                <EligibilityItem
                  id="ogn-holder"
                  itemTitle="OGN holder"
                  tokens={claim.optional.split.ogn}
                  showOgvToken={true}
                />
                <EligibilityItem
                  id="ousd-holder"
                  itemTitle="OUSD holder"
                  tokens={claim.mandatory.split.ousd}
                  showOgvToken={false}
                />
                <EligibilityItem
                  id="wousd-holder"
                  itemTitle="WOUSD holder"
                  tokens={claim.mandatory.split.wousd}
                  showOgvToken={false}
                />
                <EligibilityItem
                  id="ogn-staker"
                  itemTitle="Staked OGN"
                  tokens={claim.optional.split.ognStaking}
                  showOgvToken={true}
                />
                <EligibilityItem
                  id="ousd-3Crv"
                  itemTitle="OUSD 3Pool holder"
                  tokens={claim.optional.split.ousd3Crv}
                  showOgvToken={true}
                />
                <EligibilityItem
                  id="ousd-3Crv-gauge"
                  itemTitle="Staked OUSD 3Pool"
                  tokens={claim.optional.split.ousd3CrvGauge}
                  showOgvToken={true}
                />
                <EligibilityItem
                  id="ousd-convex-staker"
                  itemTitle="Staked on Convex"
                  tokens={claim.optional.split.convex}
                  showOgvToken={true}
                />
              </tbody>
            </table>
          )}
        </div>
      </Card>
      <div className="mt-6 flex">
        <div className="ml-auto">
          <Button onClick={handleNextStep} disabled={!canAdvance}>
            Learn about Origin &rarr;
          </Button>
        </div>
      </div>
    </>
  );
};

export default Eligibility;
