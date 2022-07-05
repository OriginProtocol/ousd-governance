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
import { decimal18Bn } from "utils";
import numeral from "numeraljs";
import { getRewardsApy } from "utils/apy";

interface ClaimVeOgvProps {}

const ClaimVeOgv: FunctionComponent<ClaimVeOgvProps> = () => {
  const claim = useClaim();
  if (!claim.loaded || !claim.optional.hasClaim) {
    return <></>;
  }

  const totalSupplyVeOgv = claim.staking.totalSupplyVeOgvAdjusted || 0;
  const claimableVeOgv = claim.mandatory.isValid
    ? numeral(claim.mandatory.amount.div(decimal18Bn).toString()).value()
    : 0;

  // as specified here: https://github.com/OriginProtocol/ousd-governance/blob/master/contracts/OgvStaking.sol#L21
  const votingDecayFactor = 1.8;

  const now = new Date();
  const veOgvFromVeOgvClaim =
    (claimableVeOgv / 4) * votingDecayFactor ** (52 / 52) +
    (claimableVeOgv / 4) * votingDecayFactor ** (104 / 52) +
    (claimableVeOgv / 4) * votingDecayFactor ** (156 / 52) +
    (claimableVeOgv / 4) * votingDecayFactor ** (208 / 52);

  const veOgvLockupRewardApy = getRewardsApy(
    veOgvFromVeOgvClaim,
    claimableVeOgv,
    totalSupplyVeOgv
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

  return (
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
                      unlocks {moment(twoYearsFromNow).format("MMM D, YYYY")}
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
                      unlocks {moment(threeYearsFromNow).format("MMM D, YYYY")}
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
                      unlocks {moment(fourYearsFromNow).format("MMM D, YYYY")}
                    </span>
                  </span>
                </th>
                <td className="w-1/4">{(claimableVeOgv / 4).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="pt-3">
          <Button
            onClick={async () => {
              claim.mandatory.claim();
            }}
            large
          >
            Claim
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ClaimVeOgv;
