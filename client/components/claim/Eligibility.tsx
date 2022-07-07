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
import { mdiWallet, mdiCheckCircle, mdiAlertCircle } from "@mdi/js";

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
            <div className="space-y-4">
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
                    <div className="mb-20">
                      <div className="space-y-4 bg-accent text-white -m-10 p-10">
                        <Icon
                          path={mdiCheckCircle}
                          size={2}
                          className="text-white mx-auto"
                        />
                        <h2 className="text-2xl font-bold">
                          You are eligible!
                        </h2>
                        <div>
                          <p className="text-sm max-w-sm mx-auto">
                            <span className="font-bold">Your address:</span>
                            <br />
                            <span className="truncate block">{address}</span>
                          </p>
                          <div className="pt-9">
                            <Button
                              fullWidth
                              large
                              white
                              onClick={handleNextStep}
                            >
                              Continue
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Icon
                        path={mdiAlertCircle}
                        size={2}
                        className="text-orange-500 mx-auto"
                      />
                      <h2 className="text-2xl font-bold">
                        This address has an invalid claim proof
                      </h2>
                      <div>
                        <p className="text-sm max-w-sm mx-auto">
                          <span className="font-bold">Your address:</span>
                          <br />
                          <span className="truncate block">{address}</span>
                        </p>
                        <div className="pt-9">
                          <Button
                            fullWidth
                            large
                            alt
                            onClick={handleDisconnect}
                          >
                            Try another address
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <Icon
                    path={mdiAlertCircle}
                    size={2}
                    className="text-[#dd0a0a] mx-auto"
                  />
                  <h2 className="text-2xl font-bold">
                    Unfortunately, this address is not eligible
                  </h2>
                  <div>
                    <p className="text-sm max-w-sm mx-auto">
                      <span className="font-bold">Your address:</span>
                      <br />
                      <span className="truncate block">{address}</span>
                    </p>
                    <div className="pt-9">
                      <Button fullWidth large alt onClick={handleDisconnect}>
                        Try another address
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          {isEligible && claimValid && (
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
