import { useState, useEffect } from "react";
import type { NextPage } from "next";
import Wrapper from "components/Wrapper";
import StepTracker from "components/StepTracker";
import Education from "@/components/claim/Education";
import Eligibility from "@/components/claim/Eligibility";
import HoldingPage from "components/holding/Page";
import Claim from "components/claim/Claim";
import { useStore } from "utils/store";
import { claimOpenTimestampPassed, claimIsOpen } from "utils";
import Seo from "components/Seo";
import { PageTitle } from "components/PageTitle";
import CardGroup from "components/CardGroup";
import AccountBalances from "components/vote-escrow/AccountBalances";
import YourLockups from "components/vote-escrow/YourLockups";
import Card from "components/Card";
import Button from "components/Button";
import useClaim from "utils/useClaim";
import { getRewardsApy } from "utils/apy";
import Link from "components/Link";

interface ClaimPageProps {}

const ClaimPage: NextPage<ClaimPageProps> = () => {
  const claim = useClaim();
  const totalSupplyVeOgv = claim.staking.totalSupplyVeOgvAdjusted || 0;
  // Standard APY figure, assumes 100 OGV locked for max duration
  const stakingApy = getRewardsApy(
    100 * 1.8 ** (48 / 12),
    100,
    totalSupplyVeOgv
  );

  return (
    <Wrapper narrow>
      <Seo title="Claim OGV" />
      <PageTitle>Claim</PageTitle>
      <Card margin>
        <div className="bg-accent text-white -mt-10 -mx-6 p-10 md:-mx-10 text-center">
          <h2 className="text-[1.75rem] line-height-[2.125rem]">
            The claim period has now expired
          </h2>
          <div className="mt-3 text-sm font-bold">
            {`All unclaimed OGV was burned after 90 days. You can still buy OGV and stake it for up to four years. Current OGV stakers are earning a vAPY of ${stakingApy.toFixed(
              2
            )}%.`}
          </div>
          <div className="mt-6">
            <Link
              className={
                "w-[15.5rem] btn rounded-full normal-case space-x-2 btn-lg h-[3.25rem] min-h-[3.25rem] bg-white border-none"
              }
              href="/stake"
            >
              {"Create a new stake"}
            </Link>
          </div>
        </div>
        <div className="-mb-10 -mx-6 p-10 md:-mx-10 text-center">
          <div>
            <Link
              className={
                "w-[15.5rem] btn rounded-full normal-case space-x-2 btn-lg h-[3.25rem] min-h-[3.25rem] btn-primary border-none"
              }
              href="https://blog.originprotocol.com/tokenomics-retroactive-rewards-and-prelaunch-liquidity-mining-campaign-for-ogv-1b20b8ab41c8"
              type="external"
              newWindow
            >
              {"Read about the airdrop"}
            </Link>
          </div>
          <div className="mt-2">
            <Link
              className={
                "w-[15.5rem] btn rounded-full normal-case space-x-2 btn-lg h-[3.25rem] min-h-[3.25rem] btn-primary border-none"
              }
              href="https://www.ousd.com/burn"
              type="external"
              newWindow
            >
              {"See the OGV burn"}
            </Link>
          </div>
        </div>
      </Card>
    </Wrapper>
  );
};

export default ClaimPage;
