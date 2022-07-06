import { FunctionComponent, useState, useEffect } from "react";
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
import numeral from "numeraljs";
import { getRewardsApy } from "utils/apy";
import { decimal18Bn } from "utils";

interface ClaimOgvProps {}

const ClaimOgv: FunctionComponent<ClaimOgvProps> = () => {
  const claim = useClaim();

  const maxLockupDurationInWeeks = "208";
  const [lockupDuration, setLockupDuration] = useState(
    maxLockupDurationInWeeks
  );
  const totalSupplyVeOgv = claim.staking.totalSupplyVeOgvAdjusted || 0;
  if (!claim.loaded || !claim.optional.hasClaim) {
    return <></>;
  }

  const isValidLockup = lockupDuration > 0;
  const claimableOgv = claim.optional.isValid
    ? numeral(claim.optional.amount.div(decimal18Bn).toString()).value()
    : 0;
  // as specified here: https://github.com/OriginProtocol/ousd-governance/blob/master/contracts/OgvStaking.sol#L21
  const votingDecayFactor = 1.8;

  const veOgvFromOgvLockup =
    claimableOgv * votingDecayFactor ** (lockupDuration / 52);
  const ogvLockupRewardApy = getRewardsApy(
    veOgvFromOgvLockup,
    claimableOgv,
    totalSupplyVeOgv
  );
  const maxVeOgvFromOgvLockup = claimableOgv * votingDecayFactor ** (208 / 52);
  const maxOgvLockupRewardApy = getRewardsApy(
    maxVeOgvFromOgvLockup,
    claimableOgv,
    totalSupplyVeOgv
  );

  const now = new Date();
  const lockupEnd = new Date(
    now.getTime() + lockupDuration * 7 * 24 * 60 * 60 * 1000
  );

  let claimButtonText = "";
  if (isValidLockup && claim.optional.state === "ready") {
    claimButtonText = "Claim and lock";
  } else if (claim.optional.state === "ready") {
    claimButtonText = "Claim";
  } else if (claim.optional.state === "waiting-for-user") {
    claimButtonText = "Please Confirm Transaction";
  } else if (claim.optional.state === "waiting-for-network") {
    claimButtonText = "Waiting to be mined";
  } else if (claim.optional.state === "claimed") {
    claimButtonText = "Claimed";
  }

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
                <CardLabel>Lock-up reward</CardLabel>
                <div className="flex space-x-1 items-center">
                  <CardStat>
                    {isValidLockup ? ogvLockupRewardApy.toFixed(2) : 0}%
                  </CardStat>
                </div>
                <CardDescription>vAPY</CardDescription>
              </div>
            </Card>
          </CardGroup>
          <div className="space-y-2">
            <div>
              <RangeInput
                label="Lock your OGV for"
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
              <span className="font-bold">Note:</span> If you don&apos;t lock
              your OGV, you&apos;ll be missing out on up to{" "}
              {maxOgvLockupRewardApy.toFixed(2)}% vAPY in rewards!
            </span>
          )}
          <div className="pt-3">
            <Button
              onClick={async () => {
                claim.optional.claim(parseInt(lockupDuration));
              }}
              disabled={claim.optional.state !== "ready"}
              large
            >
              {claimButtonText}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ClaimOgv;
