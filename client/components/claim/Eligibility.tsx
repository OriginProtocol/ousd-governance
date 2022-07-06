import { FunctionComponent, useCallback } from "react";
import Image from "next/image";
import Card from "components/Card";
import { Web3Button } from "components/Web3Button";
import Button from "components/Button";
import { useStore } from "utils/store";
import { truncateEthAddress } from "utils/index";
import useClaim from "utils/useClaim";
import EligibilityItem from "components/claim/EligibilityItem";
import Icon from "@mdi/react";
import { mdiWallet } from "@mdi/js";

interface EligibilityProps {
  handleNextStep: () => void;
}

const Eligibility: FunctionComponent<EligibilityProps> = ({
  handleNextStep,
}) => {
  const { provider, web3Provider, address, web3Modal } = useStore();
  const claim = useClaim();
  const isEligible = claim.loaded && claim.hasClaim;
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
        <div className="text-center">
          {!web3Provider ? (
            <div className="space-y-3">
              <Icon path={mdiWallet} size={2} className="text-accent mx-auto" />
              <h2 className="text-2xl font-bold">
                Connect your wallet to get started
              </h2>
              <p className="text-sm max-w-sm mx-auto">
                We will automatically determine eligibility based on your wallet
                address.
              </p>
              <div className="pt-6">
                <Web3Button inPage />
              </div>
            </div>
          ) : (
            <>
              {isEligible ? (
                <div className="space-y-2">
                  {claimValid ? (
                    <>
                      <div>
                        <p className="text-accent font-bold text-center text-lg">
                          {truncateEthAddress(address)} is eligible to claim!
                        </p>
                      </div>
                      {canAdvance && (
                        <Button onClick={handleNextStep} large fullWidth>
                          Continue
                        </Button>
                      )}
                    </>
                  ) : (
                    <div>
                      <p className="text-orange-500 font-bold text-center text-lg">
                        {truncateEthAddress(address)} has an invalid claim
                        proof!
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div>
                    <p className="text-gray-500 font-bold text-center text-lg">
                      Unfortunately, {truncateEthAddress(address)} isn&apos;t
                      eligible to claim
                    </p>
                  </div>
                </>
              )}
              {!isEligible && (
                <div className="mt-2">
                  <button
                    className="text-sm text-gray-500 underline ml-auto block"
                    onClick={handleDisconnect}
                  >
                    Try another address
                  </button>
                </div>
              )}
            </>
          )}
          {isEligible && (
            <div className="space-y-2">
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
                    itemTitle="wOUSD holder"
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
            </div>
          )}
        </div>
      </Card>
    </>
  );
};

export default Eligibility;
