import { FunctionComponent, ReactNode, useEffect, useState } from "react";
import Countdown, { CountdownRendererFn } from "react-countdown";
import { PageTitle } from "../PageTitle";
import { SectionTitle } from "../SectionTitle";
import CardGroup from "../CardGroup";
import Card from "../Card";
import CardDescription from "../CardDescription";
import CardStat from "../CardStat";
import ExternalLinkIcon from "../icons/ExternalLinkIcon";
import { useStore } from "utils/store";

const renderer: CountdownRendererFn = ({ days, hours, minutes, seconds }) => (
  <CardGroup horizontal fourCol dontStackOnMobile>
    <Card dark tightPadding>
      <CardStat>{days}</CardStat>
      <CardDescription>Days</CardDescription>
    </Card>
    <Card dark tightPadding>
      <CardStat>{hours}</CardStat>
      <CardDescription>Hours</CardDescription>
    </Card>
    <Card dark tightPadding>
      <CardStat>{minutes}</CardStat>
      <CardDescription>Minutes</CardDescription>
    </Card>
    <Card dark tightPadding>
      <CardStat>{seconds}</CardStat>
      <CardDescription>Seconds</CardDescription>
    </Card>
  </CardGroup>
);

const HoldingPage = () => {
  const { claim } = useStore();
  const [date, setDate] = useState(null);

  // Super weird workaround so that NextJs doesn't report client/server render miss match
  useEffect(() => {
    setTimeout(() => {
      let date = new Date(0);
      date.setUTCSeconds(parseInt(claim.claimOpensTs || "0"));
      setDate(date);
    }, 1);
  }, []);

  return (
    <>
      <PageTitle>OGV token launch countdown</PageTitle>
      <CardGroup>
        {date && <Countdown date={date} renderer={renderer} />}
        <Card>
          <SectionTitle>
            <div className="flex items-center justify-between">
              <span>Key dates</span>
              <span className="text-sm text-gray-500 ml-2">
                All times midnight UTC
              </span>
            </div>
          </SectionTitle>

          <div className="overflow-scroll">
            <div className="w-full flex text-left">
              <div className="divide-y w-full">
                <div className="flex flex-col pb-2">
                  <div className="font-bold">June 1</div>
                  <div className="text-gray-600">
                    Prelaunch liquidity mining campaign begins
                  </div>
                </div>
                <div className="py-2">
                  <div className="font-bold">June 28</div>
                  <div className="text-gray-600">
                    Final list of exchanges supporting OGV to be published
                  </div>
                </div>
                <div className="py-2">
                  <div className="font-bold">July 5-12</div>
                  <div className="text-gray-600">OGN snapshot window</div>
                </div>
                <div className="py-2">
                  <div className="font-bold">July 12</div>
                  <div className="text-gray-600">OGV airdrop</div>
                </div>
                <div className="py-2">
                  <div className="font-bold">October 10</div>
                  <div className="text-gray-600">
                    90-day deadline to claim airdrop
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-4 lg:space-y-0 lg:space-x-4 lg:flex mt-6">
            <a
              className="btn btn-lg btn-primary rounded-full w-full lg:flex-1"
              href="https://app.uniswap.org/#/swap?outputCurrency=0x8207c1FfC5B6804F6024322CcF34F29c3541Ae26&amp;chain=mainnet"
              target="_blank"
              rel="noopener noreferrer"
            >
              Buy OGN on Uniswap
            </a>
            <a
              className="btn btn-lg btn-primary rounded-full w-full lg:flex-1"
              href="https://curve.fi/factory/9/deposit"
              target="_blank"
              rel="noopener noreferrer"
            >
              Be an OUSD LP
            </a>
          </div>
          <a
            className="text-sm text-gray-600 mt-6 flex"
            href="https://blog.originprotocol.com/tokenomics-retroactive-rewards-and-prelaunch-liquidity-mining-campaign-for-ogv-1b20b8ab41c8"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="mr-1">Learn more about the OGV token launch</span>
            <ExternalLinkIcon />
          </a>
        </Card>
      </CardGroup>
    </>
  );
};

export default HoldingPage;
