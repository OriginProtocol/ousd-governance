import { FunctionComponent, ReactNode } from "react";
import Countdown, { CountdownRendererFn } from "react-countdown";
import { PageTitle } from "../PageTitle";
import { SectionTitle } from "../SectionTitle";
import CardGroup from "../CardGroup";
import Card from "../Card";
import CardDescription from "../CardDescription";
import CardStat from "../CardStat";
import ExternalLinkIcon from "../ExternalLinkIcon";

const renderer: CountdownRendererFn = ({ days, hours, minutes, seconds }) => (
  <CardGroup horizontal fourCol>
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

let date = new Date(0);
date.setUTCSeconds(parseInt(process.env.CLAIM_OPENS || "0"));

const HoldingPage: FunctionComponent = () => (
  <>
    <PageTitle>OGV token launch countdown</PageTitle>
    <CardGroup>
      <Countdown date={date} renderer={renderer} />
      <Card>
        <SectionTitle>Key dates</SectionTitle>
        <div className="overflow-scroll">
          <table className="table table-zebra w-full">
            <tbody>
              <tr>
                <th>June 1</th>
                <td>Prelaunch liquidity mining campaign begins</td>
              </tr>
              <tr>
                <th>June 28</th>
                <td>Final list of exchanges supporting OGV to be published</td>
              </tr>
              <tr>
                <th>July 5-12</th>
                <td>OGN snapshot window</td>
              </tr>
              <tr>
                <th>July 12</th>
                <td>OGV airdrop</td>
              </tr>
              <tr>
                <th>October 10</th>
                <td>90-day deadline to claim airdrop</td>
              </tr>
            </tbody>
          </table>
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
            href="https://www.ousd.com/swap"
            target="_blank"
            rel="noopener noreferrer"
          >
            Get OUSD
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

export default HoldingPage;
