import { FunctionComponent, useState } from "react";
import moment from "moment";
import Card from "components/Card";
import { SectionTitle } from "components/SectionTitle";
import CardGroup from "components/CardGroup";
import CardLabel from "components/CardLabel";
import TokenIcon from "components/TokenIcon";
import TokenAmount from "components/TokenAmount";
import CardStat from "components/CardStat";
import CardDescription from "components/CardDescription";
import Button from "components/Button";
import RangeInput from "@/components/RangeInput";
import useClaim from "utils/useClaim";

interface ClaimOgvProps {}

const ClaimOgv: FunctionComponent<ClaimOgvProps> = () => {
  const claimableOgv = 100; // @TODO replace with user value
  const claim = useClaim();
  const maxLockupDurationInWeeks = "208";

  //const [lockupAmount, setLockupAmount] = useState(claimableOgv);
  const [lockupDuration, setLockupDuration] = useState(
    maxLockupDurationInWeeks
  );

  const isValidLockup = lockupDuration > 0;

  const votingDecayFactor = 1.8; // @TODO replace with contract value
  const ogvPrice = 0.15; // @TODO replace with live value
  const totalVeOgv = 12980905133; // @TODO replace with live value
  const stakingRewards = 100000000; // @TODO replace with real value

  const getOgvLockupRewardApy = (veOgv: number) => {
    const ogvPercentageOfRewards = veOgv / (totalVeOgv + veOgv);
    const ogvRewards = stakingRewards * ogvPercentageOfRewards;
    const valueOfOgvRewards = ogvRewards * ogvPrice;
    const ogvLockupRewardApr =
      (valueOfOgvRewards * 12) / (claimableOgv * ogvPrice);

    return ((1 + ogvLockupRewardApr / 12) ** 12 - 1) * 100;
  };

  const veOgvFromOgvLockup = isValidLockup
    ? claimableOgv * votingDecayFactor ** (lockupDuration / 52)
    : 0;
  const ogvLockupRewardApy = getOgvLockupRewardApy(veOgvFromOgvLockup);

  const maxVeOgvFromOgvLockup = claimableOgv * votingDecayFactor ** (208 / 52);
  const maxOgvLockupRewardApy = getOgvLockupRewardApy(maxVeOgvFromOgvLockup);

  const now = new Date();
  const lockupEnd = new Date(
    now.getTime() + lockupDuration * 7 * 24 * 60 * 60 * 1000
  );

  return (
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
                    {isValidLockup ? ogvLockupRewardApy.toFixed(2) : 0}%
                  </CardStat>
                </div>
                <CardDescription>APY</CardDescription>
              </div>
            </Card>
          </CardGroup>
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
                    <td className="w-1/4">{veOgvFromOgvLockup.toFixed(2)}</td>
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
                            unlocks {moment(lockupEnd).format("MMM D, YYYY")}
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
              <span className="font-bold">Note:</span> If you don&apos;t lock up
              your {claimableOgv} OGV, you&apos;ll be missing out on up to{" "}
              {maxOgvLockupRewardApy.toFixed(2)}% APY in rewards!
            </span>
          )}
          <div className="pt-3">
            <Button 
              onClick={async () => {
                claim.optional.claim(parseInt(lockupDuration));
              }}
              large
            >{isValidLockup ? `Claim and lock` : `Claim`}</Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ClaimOgv;
