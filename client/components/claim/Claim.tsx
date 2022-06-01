import { FunctionComponent, useState } from "react";
import moment from "moment";
import { SectionTitle } from "components/SectionTitle";
import Wrapper from "components/Wrapper";
import Card from "components/Card";
import CardGroup from "components/CardGroup";
import CardLabel from "components/CardLabel";
import CardStat from "components/CardStat";
import RangeInput from "components/vote-escrow/RangeInput";
import Button from "components/Button";
import { truncateEthAddress } from "utils/index";
import { useStore } from "utils/store";
import { Web3Button } from "components/Web3Button";
import TokenIcon from "components/TokenIcon";
import CardDescription from "components/CardDescription";
import BarChart from "components/BarChart";
import ExternalLinkIcon from "components/ExternalLinkIcon";
import Link from "components/Link";
import TokenAmount from "components/TokenAmount";

interface ClaimProps {
  handlePrevStep: () => void;
}

const Claim: FunctionComponent<ClaimProps> = ({ handlePrevStep }) => {
  const { web3Provider, address } = useStore();

  const isEligible = true; // @TODO replace with real check
  const claimableOgv = 100; // @TODO replace with real value
  const currentApy = 1.2345; // @TODO replace with real %

  const maxLockupDurationInWeeks = "208";

  const [lockupAmount, setLockupAmount] = useState(claimableOgv);
  const [lockupDuration, setLockupDuration] = useState(
    maxLockupDurationInWeeks
  );

  const isValidLockup = lockupAmount > 0 && lockupDuration > 0;
  const projectedApy =
    (currentApy / maxLockupDurationInWeeks) * lockupDuration * 100;
  const maxRewards =
    claimableOgv * (currentApy / 52) * maxLockupDurationInWeeks;

  const now = new Date();
  const lockupEnd = new Date(
    now.getTime() + lockupDuration * 7 * 24 * 60 * 60 * 1000
  );
  const fourYearsFromNow = new Date(
    now.getTime() + 4 * 365 * 24 * 60 * 60 * 1000
  );
  const threeYearsFromNow = new Date(
    now.getTime() + 3 * 365 * 24 * 60 * 60 * 1000
  );
  const twoYearsFromNow = new Date(
    now.getTime() + 2 * 365 * 24 * 60 * 60 * 1000
  );
  const oneYearFromNow = new Date(
    now.getTime() + 1 * 365 * 24 * 60 * 60 * 1000
  );

  const claimableVeOgv = 100;

  if (!web3Provider) {
    return (
      <Wrapper narrow>
        <Card>
          <SectionTitle>Please connect your wallet to claim</SectionTitle>
          <Web3Button inPage />
        </Card>
      </Wrapper>
    );
  }

  if (!isEligible) {
    return (
      <Wrapper narrow>
        <Card>
          <SectionTitle>
            Unfortunately, you&apos;re not eligible to claim.
          </SectionTitle>
          <p className="text-sm text-gray-600">
            Try connecting another wallet.
          </p>
        </Card>
      </Wrapper>
    );
  }

  return (
    <>
      <CardGroup>
        <CardGroup horizontal>
          <div>
            <Card dark tightPadding>
              <div className="space-y-1">
                <CardLabel>Total supply</CardLabel>
                <div className="flex space-x-1 items-center">
                  <TokenIcon src="/ogv.svg" alt="OGV" />
                  <CardStat>
                    <TokenAmount amount="1000000000" />
                  </CardStat>
                </div>
                <CardDescription>OGV</CardDescription>
              </div>
            </Card>
          </div>
          <div>
            <Card dark tightPadding>
              <div className="space-y-1">
                <CardLabel>Locked up</CardLabel>
                <div className="flex space-x-1 items-center">
                  <TokenIcon src="/ogv.svg" alt="OGV" />
                  <CardStat>
                    <TokenAmount amount="750000000" />
                  </CardStat>
                </div>
                <CardDescription>OGV</CardDescription>
              </div>
            </Card>
          </div>
          <div>
            <Card dark tightPadding>
              <div className="space-y-1">
                <CardLabel>% locked up</CardLabel>
                <div className="flex space-x-1 items-center">
                  <TokenIcon src="/ogv.svg" alt="OGV" />
                  <CardStat>75%</CardStat>
                </div>
                <CardDescription>OGV</CardDescription>
              </div>
            </Card>
          </div>
        </CardGroup>
        <Card>
          <div className="divide-y space-y-6">
            <div className="space-y-4">
              <SectionTitle>Claim OGV</SectionTitle>
              <CardGroup horizontal twoCol>
                <Card alt tightPadding>
                  <div className="space-y-1">
                    <CardLabel>Your eligibility</CardLabel>
                    <div className="flex space-x-1 items-center">
                      <TokenIcon src="/ogv.svg" alt="OGV" />
                      <CardStat>
                        <TokenAmount amount={claimableOgv} />
                      </CardStat>
                    </div>
                    <CardDescription>OGV</CardDescription>
                  </div>
                </Card>
                <Card alt tightPadding>
                  <div className="space-y-1">
                    <CardLabel>Lockup reward</CardLabel>
                    <div className="flex space-x-1 items-center">
                      <CardStat>
                        {isValidLockup ? projectedApy.toFixed(2) : 0}%
                      </CardStat>
                    </div>
                    <CardDescription>APY</CardDescription>
                  </div>
                </Card>
              </CardGroup>
              {/*<p className="text-gray-600 text-sm">Locking up your OGV when you claim gives you governance votes (veOGV) and rewards (further OGV). The longer you lock up your OGV for, the greater your OGV rewards will be.</p>*/}
              <div className="space-y-2">
                {/*<div>
                      <RangeInput
                        label="Lock up your"
                        counterUnit="OGV"
                        min={"0"}
                        max={claimableOgv}
                        value={lockupAmount}
                        onChange={(e) => {
                          setLockupAmount(e.target.value);
                        }}
                        markers={[
                          {
                            label: "0%",
                            value: 0,
                          },
                          {
                            label: "",
                            value: 0,
                          },
                          {
                            label: "20%",
                            value: 20,
                          },
                          {
                            label: "",
                            value: 0,
                          },
                          {
                            label: "40%",
                            value: 40,
                          },
                          {
                            label: "",
                            value: 0,
                          },
                          {
                            label: "60%",
                            value: 60,
                          },
                          {
                            label: "",
                            value: 0,
                          },
                          {
                            label: "80%",
                            value: 80,
                          },
                          {
                            label: "",
                            value: 0,
                          },
                          {
                            label: "100%",
                            value: 100,
                          },
                        ]}
                        onMarkerClick={(markerValue) => {
                          if (markerValue) {
                            setLockupAmount((claimableOgv / 100) * markerValue);
                          }
                        }}
                      />
                      </div>*/}
                <div>
                  <RangeInput
                    label="Lock up your OGV for"
                    counterUnit="weeks"
                    min="0"
                    max={maxLockupDurationInWeeks}
                    value={lockupDuration}
                    onChange={(e) => {
                      setLockupDuration(e.target.value);
                    }}
                    markers={[
                      {
                        label: "0 wks",
                        value: 0,
                      },
                      {
                        label: "",
                        value: 0,
                      },
                      {
                        label: "1 yr",
                        value: 52,
                      },
                      {
                        label: "",
                        value: 0,
                      },
                      {
                        label: "2 yrs",
                        value: 104,
                      },
                      {
                        label: "",
                        value: 0,
                      },
                      {
                        label: "3 yrs",
                        value: 156,
                      },
                      {
                        label: "",
                        value: 0,
                      },
                      {
                        label: "4 yrs",
                        value: 208,
                      },
                    ]}
                    onMarkerClick={(markerValue) => {
                      if (markerValue) {
                        setLockupDuration(markerValue);
                      }
                    }}
                  />
                </div>
              </div>
              {/*<CardGroup horizontal twoCol>
                    <Card alt tightPadding>
                      <div className="space-y-1">
                        <CardLabel>You&apos;ll recieve</CardLabel>
                        <div className="flex space-x-1 items-center">
                          <TokenIcon src="/veogv.svg" alt="veOGV" />
                          <CardStat>100</CardStat>
                        </div>
                        <CardDescription>veOGV</CardDescription>
                      </div>
                    </Card>
                    <Card alt tightPadding>
                      <div className="space-y-1">
                        <CardLabel>Rewards</CardLabel>
                        <CardStat>123%</CardStat>
                        <CardDescription>APY</CardDescription>
                      </div>
                    </Card>
                      </CardGroup>*/}
              <div className="space-y-2 pt-3">
                <p className="text-gray-600 text-sm">You are claiming:</p>
                <table className="table table-compact w-full">
                  <tbody>
                    {isValidLockup ? (
                      <tr>
                        <th className="flex items-center space-x-2">
                          <TokenIcon src="/veogv.svg" alt="veOGV" />
                          <span>veOGV</span>
                        </th>
                        <td className="w-1/4">
                          {(
                            (claimableOgv / maxLockupDurationInWeeks) *
                            lockupDuration
                          ).toFixed(2)}
                        </td>
                      </tr>
                    ) : (
                      <tr>
                        <th className="flex items-center space-x-2">
                          <TokenIcon src="/ogv.svg" alt="OGV" />
                          <span>OGV</span>
                        </th>
                        <td className="w-1/4">
                          {isValidLockup ? 0 : claimableOgv}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                {isValidLockup && (
                  <>
                    <p className="text-gray-600 text-sm">You are locking up:</p>
                    <table className="table table-compact w-full">
                      <tbody>
                        <tr>
                          <th className="flex items-center space-x-2">
                            <TokenIcon src="/ogv.svg" alt="OGV" />
                            <span>
                              OGV
                              <span className="block text-xs text-gray-500 font-normal italic">
                                unlocks{" "}
                                {moment(lockupEnd).format("MMM D, YYYY")}
                              </span>
                            </span>
                          </th>
                          <td className="w-1/4">{claimableOgv.toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </>
                )}
              </div>
              {!isValidLockup && (
                <span className="block bg-red-500 text-white px-4 py-3">
                  <span className="font-bold">Note:</span> If you don&apos;t
                  lock up your {claimableOgv} OGV, you&apos;ll be missing out on
                  up to {(currentApy * 100).toFixed(2)}% APY in rewards!
                </span>
              )}
              <div className="pt-3">
                <Button large>
                  {isValidLockup ? `Claim and lock` : `Claim`}
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="space-y-4">
            <SectionTitle>Claim veOGV</SectionTitle>
            <CardGroup horizontal twoCol>
              <Card alt tightPadding>
                <div className="space-y-1">
                  <CardLabel>Your eligibility</CardLabel>
                  <div className="flex space-x-1 items-center">
                    <TokenIcon src="/ogv.svg" alt="OGV" />
                    <CardStat>
                      <TokenAmount amount={claimableVeOgv} />
                    </CardStat>
                  </div>
                  <CardDescription>OGV</CardDescription>
                </div>
              </Card>
              <Card alt tightPadding>
                <div className="space-y-1">
                  <CardLabel>Lockup reward</CardLabel>
                  <div className="flex space-x-1 items-center">
                    <CardStat>
                      {(
                        (claimableVeOgv / 4) * currentApy +
                        (claimableVeOgv / 4) * (currentApy * 0.75) +
                        (claimableVeOgv / 4) * (currentApy * 0.5) +
                        (claimableVeOgv / 4) * (currentApy * 0.25)
                      ).toFixed(2)}
                      %
                    </CardStat>
                  </div>
                  <CardDescription>APY</CardDescription>
                </div>
              </Card>
            </CardGroup>
            <div className="space-y-2 pt-3">
              <p className="text-gray-600 text-sm">You are claiming:</p>
              <table className="table table-compact w-full">
                <tbody>
                  <tr>
                    <th className="flex items-center space-x-2">
                      <TokenIcon src="/veogv.svg" alt="veOGV" />
                      <span>veOGV</span>
                    </th>
                    <td className="w-1/4">
                      {claimableVeOgv / 4 +
                        (claimableVeOgv / 4) * 0.75 +
                        (claimableVeOgv / 4) * 0.5 +
                        (claimableVeOgv / 4) * 0.25}
                    </td>
                  </tr>
                </tbody>
              </table>
              <p className="text-gray-600 text-sm">You are locking up:</p>
              <table className="table table-compact w-full">
                <tbody>
                  <tr>
                    <th className="flex items-center space-x-2">
                      <TokenIcon src="/ogv.svg" alt="OGV" />
                      <span>
                        OGV
                        <span className="block text-xs text-gray-500 font-normal italic">
                          unlocks {moment(oneYearFromNow).format("MMM D, YYYY")}
                        </span>
                      </span>
                    </th>
                    <td className="w-1/4">{(claimableOgv / 4).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <th className="flex items-center space-x-2">
                      <TokenIcon src="/ogv.svg" alt="OGV" />
                      <span>
                        OGV
                        <span className="block text-xs text-gray-500 font-normal italic">
                          unlocks{" "}
                          {moment(twoYearsFromNow).format("MMM D, YYYY")}
                        </span>
                      </span>
                    </th>
                    <td className="w-1/4">{(claimableOgv / 4).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <th className="flex items-center space-x-2">
                      <TokenIcon src="/ogv.svg" alt="OGV" />
                      <span>
                        OGV
                        <span className="block text-xs text-gray-500 font-normal italic">
                          unlocks{" "}
                          {moment(threeYearsFromNow).format("MMM D, YYYY")}
                        </span>
                      </span>
                    </th>
                    <td className="w-1/4">{(claimableOgv / 4).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <th className="flex items-center space-x-2">
                      <TokenIcon src="/ogv.svg" alt="OGV" />
                      <span>
                        OGV
                        <span className="block text-xs text-gray-500 font-normal italic">
                          unlocks{" "}
                          {moment(fourYearsFromNow).format("MMM D, YYYY")}
                        </span>
                      </span>
                    </th>
                    <td className="w-1/4">{(claimableOgv / 4).toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            {/*<div className="pt-3">
                  <BarChart
                    data={{
                      labels: ["1 yr", "2 yr", "3 yr", "4 yr"],
                      datasets: [
                        {
                          label: "OGV",
                          data: new Array(4).fill(100),
                          backgroundColor: new Array(4).fill("#4bbc8a"),
                        },
                        {
                          label: "veOGV",
                          data: [25, 50, 75, 100],
                          backgroundColor: new Array(4).fill("#0d3020"),
                        },
                      ],
                    }}
                    caption={`Chart showing veOGV unlocking to OGV over time.`}
                  />
                  </div>*/}
            <div className="pt-3">
              <Button large>Claim</Button>
            </div>
          </div>
        </Card>
      </CardGroup>

      <div className="mt-6 flex">
        <div className="mr-auto">
          <Button onClick={handlePrevStep}>
            &larr; Check Your Eligibility
          </Button>
        </div>
      </div>
    </>
  );
};

export default Claim;
