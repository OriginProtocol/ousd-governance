import { FunctionComponent, useEffect, useState } from "react";
import moment from "moment";
import { toast } from "react-toastify";
import { sample, random } from "lodash";
import { truncateEthAddress } from "utils";
import { SectionTitle } from "components/SectionTitle";
import Wrapper from "components/Wrapper";
import Card from "components/Card";
import CardGroup from "components/CardGroup";
import CardLabel from "components/CardLabel";
import CardStat from "components/CardStat";
import RangeInput from "components/vote-escrow/RangeInput";
import Button from "components/Button";
import { useStore } from "utils/store";
import { Web3Button } from "components/Web3Button";
import TokenIcon from "components/TokenIcon";
import CardDescription from "components/CardDescription";
import TokenAmount from "components/TokenAmount";

interface ClaimProps {
  handlePrevStep: () => void;
}

const Claim: FunctionComponent<ClaimProps> = ({ handlePrevStep }) => {
  const { web3Provider } = useStore();

  const isEligible = true; // @TODO replace with real check

  const totalSupplyOfOgv = 1000000000; // @TODO replace with live value
  const totalLockedUpOgv = 750000000; // @TODO replace with live value
  const totalPercentageOfLockedUpOgv =
    (totalLockedUpOgv / totalSupplyOfOgv) * 100;

  const claimableOgv = 100; // @TODO replace with user value
  const claimableVeOgv = 100; // @TODO replace with user value

  const votingDecayFactor = 1.8; // @TODO replace with contract value
  const ogvPrice = 0.15; // @TODO replace with live value
  const totalVeOgv = 12980905133; // @TODO replace with live value
  const stakingRewards = 100000000; // @TODO replace with real value

  const maxLockupDurationInWeeks = "208";
  //const [lockupAmount, setLockupAmount] = useState(claimableOgv);
  const [lockupDuration, setLockupDuration] = useState(
    maxLockupDurationInWeeks
  );

  const isValidLockup = lockupDuration > 0;

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

  const veOgvFromVeOgvClaim =
    (claimableVeOgv / 4) * votingDecayFactor ** (52 / 52) +
    (claimableVeOgv / 4) * votingDecayFactor ** (104 / 52) +
    (claimableVeOgv / 4) * votingDecayFactor ** (156 / 52) +
    (claimableVeOgv / 4) * votingDecayFactor ** (208 / 52);
  const veOgvLockupRewardApy = 123.45; // @TODO replace with real calculated value

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

  useEffect(() => {
    // @TODO Replace with real lockup data
    const recentLockups = [
      {
        address: "0x57b0dd7967955c92b6e34a038b47fee63e1efd1a",
        ogvLockedUp: 10000,
        durationInWeeks: 208,
      },
      {
        address: "0x2C6B8C19dd7174F6e0cc56424210F19EeFe62f94",
        ogvLockedUp: 5000,
        durationInWeeks: 156,
      },
      {
        address:
          "0x3b9bddaccf50023e95592b449d5edf57d6ea483b2cc50a5620cf6cb8dbfb8229",
        ogvLockedUp: 1234,
        durationInWeeks: 52,
      },
    ];

    setInterval(async () => {
      const lockup = sample(recentLockups);
      const { address, ogvLockedUp, durationInWeeks } = lockup;
      const shortAddress =
        web3Provider?.chainId === 1
          ? (await web3Provider.lookupAddress(address)) ||
            truncateEthAddress(address)
          : truncateEthAddress(address);

      toast.success(
        `${shortAddress} just locked up ${ogvLockedUp} OGV for ${durationInWeeks} weeks`,
        {
          hideProgressBar: true,
          position: "bottom-right",
        }
      );
    }, random(5000, 20000, true));
  }, [web3Provider]);

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
                    <TokenAmount amount={totalSupplyOfOgv} />
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
                    <TokenAmount amount={totalLockedUpOgv} />
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
                  <CardStat>{totalPercentageOfLockedUpOgv}%</CardStat>
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
                        <td className="w-1/4">
                          {veOgvFromOgvLockup.toFixed(2)}
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
                  up to {maxOgvLockupRewardApy.toFixed(2)}% APY in rewards!
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
                    <CardStat>{veOgvLockupRewardApy.toFixed(2)}%</CardStat>
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
                    <td className="w-1/4">{veOgvFromVeOgvClaim.toFixed(2)}</td>
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
                    <td className="w-1/4">{(claimableVeOgv / 4).toFixed(2)}</td>
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
                    <td className="w-1/4">{(claimableVeOgv / 4).toFixed(2)}</td>
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
                    <td className="w-1/4">{(claimableVeOgv / 4).toFixed(2)}</td>
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
                    <td className="w-1/4">{(claimableVeOgv / 4).toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="pt-3">
              <Button large>Claim</Button>
            </div>
          </div>
        </Card>
      </CardGroup>
      <div className="mt-6 flex">
        <div className="mr-auto">
          <Button onClick={handlePrevStep}>&larr; Learn about Origin</Button>
        </div>
      </div>
    </>
  );
};

export default Claim;
