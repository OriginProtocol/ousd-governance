import type { NextPage } from "next";
import { useEffect, useState } from "react";
import { PageTitle } from "components/PageTitle";
import CardGroup from "components/CardGroup";
import Card from "components/Card";
import CardDescription from "components/CardDescription";
import CardStat from "components/CardStat";
import Wrapper from "components/Wrapper";
import Seo from "components/Seo";
import Countdown, { CountdownRendererFn } from "react-countdown";
import { useStore } from "utils/store";
import { SectionTitle } from "components/SectionTitle";
import Link from "components/Link";
import { BigNumber, BigNumberish } from "ethers";
import TokenAmount from "components/TokenAmount";
import { decimal18Bn } from "utils";

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

const Burn: NextPage = () => {
  const { claim, totalBalances } = useStore();
  const { mandatoryDistributorOgv, optionalDistributorOgv } = totalBalances;
  const [date, setDate] = useState(null);

  useEffect(() => {
    setTimeout(() => {
      let date = new Date(0);
      date.setUTCSeconds(parseInt(claim.claimClosesTs || "0"));
      setDate(date);
    }, 1);
  }, [claim.claimClosesTs]);

  const getPercentage = (total: BigNumber, value: BigNumber) =>
    ((parseInt(total.toString()) / parseInt(value.toString())) * 100).toFixed(
      2
    );

  const initialSupplyOfOgv = BigNumber.from(4000000000).mul(decimal18Bn);
  const amountToBeBurned =
    mandatoryDistributorOgv.gt(0) && optionalDistributorOgv.gt(0)
      ? mandatoryDistributorOgv.add(optionalDistributorOgv)
      : BigNumber.from(0);
  const percentageToBeBurned = amountToBeBurned.gt(0)
    ? getPercentage(amountToBeBurned, initialSupplyOfOgv)
    : 0;

  const totalAirdroppedOusd = BigNumber.from(450000000).mul(decimal18Bn);
  const totalAirdroppedOgn = BigNumber.from(1000000000).mul(decimal18Bn);
  const totalAirdropped = totalAirdroppedOusd.add(totalAirdroppedOgn);
  const percentageAirdroppedOusd = getPercentage(
    totalAirdroppedOusd,
    totalAirdropped
  );
  const percentageAirdroppedOgn = getPercentage(
    totalAirdroppedOgn,
    totalAirdropped
  );

  const totalClaimedOusd = totalAirdroppedOusd.sub(
    mandatoryDistributorOgv
  );
  const totalClaimedOgn = totalAirdroppedOgn.sub(
    optionalDistributorOgv
  );
  const totalClaimed = totalClaimedOusd.add(totalClaimedOgn);
  const percentageClaimedOusd = getPercentage(
    totalClaimedOusd,
    totalAirdroppedOusd
  );
  const percentageClaimedOgn = getPercentage(
    totalClaimedOgn,
    totalAirdroppedOgn
  );
  const percentageClaimed = getPercentage(totalClaimed, totalAirdropped);

  return (
    <Wrapper narrow>
      <Seo title="OGV Burn Countdown" />
      <PageTitle>OGV Burn Countdown</PageTitle>
      <CardGroup>
        {date && <Countdown date={date} renderer={renderer} />}
        <Card>
          <div className="mb-20">
            <div className="space-y-4 bg-accent text-white -my-10 -mx-6 p-10 md:-mx-10">
              <h2 className="text-2xl space-y-1">
                <span className="block border-b pb-3 border-secondary/[.15]">
                  <span className="font-bold bg-secondary px-[4px] py-[1px] rounded">
                    {percentageToBeBurned}%
                  </span>{" "}
                  of the initial supply will be burned
                </span>
                <span className="block pt-2">
                  This is{" "}
                  <span className="font-bold bg-secondary px-[4px] py-[1px] rounded">
                    <TokenAmount amount={amountToBeBurned} format="currency" />
                  </span>{" "}
                  OGV
                </span>
              </h2>
            </div>
          </div>
          <SectionTitle>What is the OGV Burn?</SectionTitle>
          <p className="text-gray-900">
            On October 10th, 2022 at 0:00UTC all unclaimed tokens from the OGV
            airdrop will be burned forever.
          </p>
          <div className="mt-5 space-y-3 flex flex-col md:space-y-0 md:flex-row md:space-x-2 w-full">
            <div>
              <Link
                className="w-full btn rounded-full normal-case space-x-2 btn-lg h-[3.25rem] min-h-[3.25rem] btn-primary"
                href="https://app.uniswap.org/#/swap?outputCurrency=0x9c354503C38481a7A7a51629142963F98eCC12D0&chain=mainnet"
                newWindow
              >
                Buy OGV
              </Link>
            </div>
            <div>
              <Link
                className="w-full btn rounded-full normal-case space-x-2 btn-lg h-[3.25rem] min-h-[3.25rem] btn-primary btn-outline"
                href="/stake"
              >
                Stake OGV
              </Link>
            </div>
          </div>
        </Card>
        <CardGroup horizontal twoCol>
          <Card>
            <SectionTitle>Airdrop Allocation Stats</SectionTitle>
            <div className="space-y-3 divide-y">
              <div>
                <span className="uppercase text-gray-600 text-xs">
                  Airdrop total
                </span>
                <p className="text-2xl">
                  <TokenAmount amount={totalAirdropped} format="currency" />{" "}
                  <span className="text-gray-600 text-sm font-normal">OGV</span>
                </p>
              </div>
              <div className="pt-3">
                <span className="uppercase text-gray-600 text-xs">
                  OUSD Holders ({percentageAirdroppedOusd}%)
                </span>
                <p className="text-xl">
                  <TokenAmount amount={totalAirdroppedOusd} format="currency" />{" "}
                  <span className="text-gray-600 text-sm font-normal">OGV</span>
                </p>
              </div>
              <div className="pt-3">
                <span className="uppercase text-gray-600 text-xs">
                  OGN Holders ({percentageAirdroppedOgn}%)
                </span>
                <p className="text-xl">
                  <TokenAmount amount={totalAirdroppedOgn} format="currency" />{" "}
                  <span className="text-gray-600 text-sm font-normal">OGV</span>
                </p>
              </div>
            </div>
          </Card>
          <Card>
            <SectionTitle>Claim Stats</SectionTitle>
            <div className="space-y-3 divide-y">
              <div>
                <span className="uppercase text-gray-600 text-xs">
                  Total claims ({percentageClaimed}%)
                </span>
                <p className="text-2xl">
                  <TokenAmount amount={totalClaimed} format="currency" />{" "}
                  <span className="text-gray-600 text-sm font-normal">OGV</span>
                </p>
              </div>
              <div className="pt-3">
                <span className="uppercase text-gray-600 text-xs">
                  OUSD Holders ({percentageClaimedOusd}%)
                </span>
                <p className="text-xl">
                  <TokenAmount amount={totalClaimedOusd} format="currency" />{" "}
                  <span className="text-gray-600 text-sm font-normal">OGV</span>
                </p>
              </div>
              <div className="pt-3">
                <span className="uppercase text-gray-600 text-xs">
                  OGN Holders ({percentageClaimedOgn}%)
                </span>
                <p className="text-xl">
                  <TokenAmount amount={totalClaimedOgn} format="currency" />{" "}
                  <span className="text-gray-600 text-sm font-normal">OGV</span>
                </p>
              </div>
            </div>
          </Card>
        </CardGroup>
      </CardGroup>
    </Wrapper>
  );
};

export default Burn;
