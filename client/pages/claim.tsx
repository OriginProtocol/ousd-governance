import type { NextPage } from "next";
import { PageTitle } from "components/PageTitle";
import { SectionTitle } from "components/SectionTitle";
import CardGroup from "components/CardGroup";
import Card from "components/Card";
import CardLabel from "components/CardLabel";
import CardStat from "components/CardStat";
import TokenAmount from "components/TokenAmount";
import CardDescription from "components/CardDescription";

interface ClaimPageProps {}

const ClaimPage: NextPage<ClaimPageProps> = () => {
  return (
    <>
      <PageTitle>Claim</PageTitle>
      <Card alt>
        <div className="space-y-8 divide-y">
          <div>
            <SectionTitle>OGV</SectionTitle>
            <div className="flex w-full">
              <div className="flex-1">
                <Card tightPadding>
                  <div className="space-y-1">
                    <CardLabel>Your qualifying balance</CardLabel>
                    <CardStat>
                      <TokenAmount amount={1} />
                    </CardStat>
                    <CardDescription>OGN</CardDescription>
                  </div>
                </Card>
              </div>
              <div className="flex flex-2 items-center justify-center px-4">
                <span className="text-6xl text-gray-700">=</span>
              </div>
              <div className="flex-1">
                <Card tightPadding>
                  <div className="space-y-1">
                    <CardLabel>Your claimable tokens</CardLabel>
                    <CardStat>
                      <TokenAmount amount={1} />
                    </CardStat>
                    <CardDescription>OGV</CardDescription>
                  </div>
                </Card>
              </div>
            </div>
            <div className="pt-6">
              <button className="btn btn-primary md:btn-lg rounded-full mr-4 flex-1">
                Claim OGV
              </button>
            </div>
          </div>
          <div className="pt-6">
            <SectionTitle>veOGV</SectionTitle>
            <div className="flex w-full">
              <div className="flex-1">
                <Card tightPadding>
                  <div className="space-y-1">
                    <CardLabel>Your qualifying balance</CardLabel>
                    <CardStat>
                      <TokenAmount amount={1} />
                    </CardStat>
                    <CardDescription>OUSD</CardDescription>
                  </div>
                </Card>
              </div>
              <div className="flex flex-2 items-center justify-center px-4">
                <span className="text-6xl text-gray-700">=</span>
              </div>
              <div className="flex-1">
                <Card tightPadding>
                  <div className="space-y-1">
                    <CardLabel>Your claimable tokens</CardLabel>
                    <CardStat>
                      <TokenAmount amount={1} />
                    </CardStat>
                    <CardDescription>veOGV</CardDescription>
                  </div>
                </Card>
              </div>
            </div>
            <div className="pt-6">
              <button className="btn normal-case btn-primary md:btn-lg rounded-full mr-4 flex-1">
                Claim veOGV
              </button>
            </div>
          </div>
        </div>
      </Card>
    </>
  );
};

export default ClaimPage;
