import type { NextPage } from "next";
import Wrapper from "components/Wrapper";
import Seo from "components/Seo";
import { PageTitle } from "components/PageTitle";
import Card from "components/Card";
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
      <PageTitle>OGV Claim</PageTitle>
      <Card margin>
        <div className="bg-accent text-white -mt-10 -mx-6 p-10 md:-mx-10 text-center">
          <h2 className="text-2xl font-header">
            The claim period has now expired
          </h2>
          <div className="mt-4 text-sm">
            {`All unclaimed OGV was burned after 90 days. You can still buy OGV and stake it for up to four years. Current OGV stakers are earning a vAPY of ${stakingApy.toFixed(
              2
            )}%.`}
          </div>
          <div className="mt-10">
            <Link
              className="py-3 text-white px-6 bg-gradient-to-r from-gradient-from to-gradient-to rounded-full"
              href="/stake"
            >
              {"Create a new stake"}
            </Link>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center gap-6 mt-16 mb-8">
          <Link
            className="flex"
            href="https://blog.originprotocol.com/tokenomics-retroactive-rewards-and-prelaunch-liquidity-mining-campaign-for-ogv-1b20b8ab41c8"
            type="external"
            newWindow
          >
            <div
              className="text-white px-6 py-3"
              style={{
                background:
                  "linear-gradient(#1E1F25, #1E1F25) padding-box,linear-gradient(to right, #B361E6 20%, #6A36FC 80%) border-box",
                borderRadius: "50em",
                border: "1px solid transparent",
                borderImage: "linear-gradient(90deg, #B361E6, #6A36FC) 1",
              }}
            >
              Read about the airdrop
            </div>
          </Link>
          <Link href="https://www.ousd.com/burn" type="external" newWindow>
            <div
              className="text-white px-6 py-3"
              style={{
                background:
                  "linear-gradient(#1E1F25, #1E1F25) padding-box,linear-gradient(to right, #B361E6 20%, #6A36FC 80%) border-box",
                borderRadius: "50em",
                border: "1px solid transparent",
                borderImage: "linear-gradient(90deg, #B361E6, #6A36FC) 1",
              }}
            >
              See the OGV burn
            </div>
          </Link>
        </div>
      </Card>
    </Wrapper>
  );
};

export default ClaimPage;
