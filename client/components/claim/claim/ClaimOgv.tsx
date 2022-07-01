import { FunctionComponent, useState, useEffect } from "react";
import moment from "moment";
import { BigNumber, utils } from "ethers";
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
import { useStore } from "utils/store";
import numeral from "numeraljs";

interface ClaimOgvProps {}

const ClaimOgv: FunctionComponent<ClaimOgvProps> = () => {
  const claim = useClaim();
  const { contracts } = useStore();

  const maxLockupDurationInWeeks = "208";
  const [lockupDuration, setLockupDuration] = useState(
    maxLockupDurationInWeeks
  );
  const [totalSupplyVeOgv, setTotalSupplyVeOgv] = useState(null);

  useEffect(() => {
    const loadTotalSupplyVeOGV = async () => {
      if (!contracts.loaded) {
        return;
      }
      try {
        const totalSupply = await contracts.OgvStaking.totalSupply();
        // TODO: verify this that we need to set some minimal total supply. Otherwise the first couple
        // of claimers will see insane reward amounts
        const minTotalSupply = utils.parseUnits("10000000", 18); // 10m of OGV
        setTotalSupplyVeOgv(
          totalSupply.lt(minTotalSupply) ? minTotalSupply : totalSupply
        );
      } catch (error) {
        console.error(`Can not fetch veOgv total supply: ${error}`);
      }
    };
    loadTotalSupplyVeOGV();
  }, [contracts]);

  if (!claim.loaded || !claim.optional.hasClaim) {
    return <></>;
  }

  const claimableOgv = claim.optional.amount;

  const isValidLockup = lockupDuration > 0;

  const votingDecayFactor = 1.8; // @TODO replace with contract value
  const ogvPriceBP = BigNumber.from(1500); // @TODO replace with live value - format is in basis points
  const stakingRewards = utils.parseUnits("400000000", 18); // (IMPORTANT) confirm before launch 400m OGV is OK

  const getOgvLockupRewardApy = (veOgv: BigNumber) => {
    const ogvPercentageOfRewards =
      numeral(veOgv.toString()) / (numeral(totalSupplyVeOgv) + numeral(veOgv.toString()));
    const ogvRewards = stakingRewards * ogvPercentageOfRewards;
    const valueOfOgvRewards = ogvRewards * ogvPriceBP / 1e4 / 1e18;
    const valueOfClaimableOgv = claimableOgv * ogvPriceBP / 1e4 / 1e18; 
    const ogvLockupRewardApr =
      (valueOfOgvRewards * 12) / valueOfClaimableOgv;

    console.log(
      "veOgv", veOgv / 1e18,
      "totalSupplyVeOgv", totalSupplyVeOgv / 1e18,
      "ogvRewards", ogvRewards / 1e18,
      "ogvPercentageOfRewards", ogvPercentageOfRewards,
      "valueOfOgvRewards", valueOfOgvRewards,
      "valueOfClaimableOgv", valueOfClaimableOgv,
      "ogvLockupRewardApr", ogvLockupRewardApr
    );

    return ((1 + ogvLockupRewardApr / 12) ** 12 - 1) * 100;
  };

  const veOgvFromOgvLockup = isValidLockup
    ? claimableOgv
        .mul(Math.round(votingDecayFactor ** (lockupDuration / 52) * 1e8))
        .div(BigNumber.from(1e8))
    : BigNumber.from(0);

  const ogvLockupRewardApy = getOgvLockupRewardApy(veOgvFromOgvLockup);

  const maxVeOgvFromOgvLockup = claimableOgv
    .mul(Math.round(votingDecayFactor ** (208 / 52) * 1e8))
    .div(BigNumber.from(1e8));
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
                    <td className="w-1/4">
                      <TokenAmount amount={veOgvFromOgvLockup} />
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <th className="flex items-center space-x-2">
                      <TokenIcon src="/ogv.svg" alt="OGV" />
                      <span>OGV</span>
                    </th>
                    <td className="w-1/4">
                      <TokenAmount amount={claimableOgv} />
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
                      <td className="w-1/4">
                        <TokenAmount amount={claimableOgv} />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </>
            )}
          </div>
          {!isValidLockup && (
            <span className="block bg-red-500 text-white px-4 py-3">
              <span className="font-bold">Note:</span> If you don&apos;t lock up
              your <TokenAmount amount={claimableOgv} /> OGV, you&apos;ll be
              missing out on up to {maxOgvLockupRewardApy.toFixed(2)}% APY in
              rewards!
            </span>
          )}
          <div className="pt-3">
            <Button
              onClick={async () => {
                claim.optional.claim(parseInt(lockupDuration));
              }}
              large
            >
              {isValidLockup ? `Claim and lock` : `Claim`}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ClaimOgv;
