import { FunctionComponent, useCallback } from "react";
import Card from "components/Card";
import { Web3Button } from "components/Web3Button";
import Button from "components/Button";
import { useStore } from "utils/store";
import useClaim from "utils/useClaim";
import EligibilityItem from "components/claim/EligibilityItem";
import Icon from "@mdi/react";
import { mdiWallet, mdiCheckCircle, mdiAlertCircle } from "@mdi/js";
import { Loading } from "components/Loading";
import Link from "components/Link";
import { getRewardsApy } from "utils/apy";
import { filter } from "lodash";
import { BigNumber } from "ethers";

interface EligibilityProps {
  handleNextStep: () => void;
}

const Eligibility: FunctionComponent<EligibilityProps> = ({
  handleNextStep,
}) => {
  const { provider, web3Provider, address, web3Modal } = useStore();
  const claim = useClaim();
  const { loaded, hasClaim } = claim;

  const hasOptionalClaim = claim.optional && claim.optional.isValid;
  const hasMandatoryClaim = claim.mandatory && claim.mandatory.isValid;

  const optionalSplits = filter(claim?.optional?.split, (split) =>
    split.gte(0)
  ).length;
  const mandatorySplits = filter(claim?.mandatory?.split, (split) =>
    split.gte(0)
  ).length;

  const totalSupplyVeOgv = claim.staking.totalSupplyVeOgvAdjusted || 0;

  // Standard APY figure, assumes 100 OGV locked for max duration
  const stakingApy = getRewardsApy(
    100 * 1.8 ** (48 / 12),
    100,
    totalSupplyVeOgv
  );

  const claimValid =
    (hasClaim && claim.optional && claim.optional.isValid) ||
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

  if (web3Provider && !loaded) {
    return (
      <Card>
        <div className="py-20">
          <Loading large />
        </div>
      </Card>
    );
  }

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
              {hasClaim ? (
                <div className="space-y-2">
                  {claimValid ? (
                    <div className="mb-20">
                      <div className="space-y-4 bg-accent text-white -my-10 -mx-6 p-10 md:-mx-10">
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
                        <div className="pt-2">
                          <button
                            className="text-sm text-gray-600 hover:underline"
                            onClick={handleDisconnect}
                          >
                            Try another address
                          </button>
                        </div>
                        <div className="pt-9 space-y-4">
                          <p className="text-2xl">
                            OGV stakers earn a {stakingApy.toFixed(2)}% variable
                            APY
                          </p>
                          <Link
                            href="https://app.uniswap.org/#/swap?inputCurrency=0x8207c1ffc5b6804f6024322ccf34f29c3541ae26&outputCurrency=0x9c354503c38481a7a7a51629142963f98ecc12d0&chain=mainnet"
                            newWindow
                            className="btn rounded-full normal-case space-x-2 btn-lg h-[3.25rem] min-h-[3.25rem] w-full btn-primary"
                          >
                            Buy OGV
                          </Link>
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
                    <div className="pt-2">
                      <button
                        className="text-sm text-gray-600 hover:underline"
                        onClick={handleDisconnect}
                      >
                        Try another address
                      </button>
                    </div>
                    <div className="pt-9 space-y-4">
                      <p className="text-2xl">
                        OGV stakers earn a {stakingApy.toFixed(2)}% variable APY
                      </p>
                      <Link
                        href="https://app.uniswap.org/#/swap?inputCurrency=0x8207c1ffc5b6804f6024322ccf34f29c3541ae26&outputCurrency=0x9c354503c38481a7a7a51629142963f98ecc12d0&chain=mainnet"
                        newWindow
                        className="btn rounded-full normal-case space-x-2 btn-lg h-[3.25rem] min-h-[3.25rem] w-full btn-primary"
                      >
                        Buy OGV
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          {hasClaim && claimValid && (
            <div className="space-y-10 sm:space-y-0">
              {hasOptionalClaim && (
                <div className="space-y-2 sm:-mt-0">
                  <table className="w-full table sm:mt-6">
                    <thead>
                      <tr className="border-none">
                        <th className="pt-0 text-center sm:text-left sm:table-cell sm:border-b">
                          Eligibility Criteria
                        </th>
                        <th className="hidden pt-0 sm:table-cell sm:border-b">
                          Tokens
                        </th>
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
                      {optionalSplits > 1 && (
                        <EligibilityItem
                          id="ogv-total"
                          itemTitle="Total"
                          tokens={claim.optional.amount}
                          showOgvToken={true}
                          isTotal
                        />
                      )}
                    </tbody>
                  </table>
                </div>
              )}
              {hasMandatoryClaim && (
                <div className="space-y-2 sm:-mt-0">
                  <table className="w-full table sm:mt-6">
                    <thead>
                      <tr className="border-none">
                        <th className="pt-0 text-center sm:text-left sm:table-cell sm:border-b">
                          Eligibility Criteria
                        </th>
                        <th className="hidden sm:table-cell sm:border-b">
                          Tokens
                        </th>
                      </tr>
                    </thead>
                    <tbody>
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
                      {mandatorySplits > 1 && (
                        <EligibilityItem
                          id="veogv-total"
                          itemTitle="Total"
                          tokens={claim.mandatory.amount}
                          showOgvToken={false}
                          isTotal
                        />
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </>
  );
};

export default Eligibility;
