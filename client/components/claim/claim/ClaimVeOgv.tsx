import { FunctionComponent, useState } from "react";
import moment from "moment";
import Card from "components/Card";
import CardGroup from "components/CardGroup";
import TokenIcon from "components/TokenIcon";
import TokenAmount from "components/TokenAmount";
import CardStat from "components/CardStat";
import CardDescription from "components/CardDescription";
import Button from "components/Button";
import useClaim from "utils/useClaim";
import { decimal18Bn } from "utils";
import numeral from "numeraljs";
import { getRewardsApy } from "utils/apy";
import Icon from "@mdi/react";
import { mdiArrowRight } from "@mdi/js";
import PostClaimModal from "./PostClaimModal";

interface ClaimVeOgvProps {}

const ClaimVeOgv: FunctionComponent<ClaimVeOgvProps> = () => {
  const claim = useClaim();

  const [hideModal, sethideModal] = useState(true);

  if (!claim.loaded || !claim.mandatory.hasClaim) {
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
    (claimableVeOgv / 4) * votingDecayFactor ** (12 / 12) +
    (claimableVeOgv / 4) * votingDecayFactor ** (24 / 12) +
    (claimableVeOgv / 4) * votingDecayFactor ** (36 / 12) +
    (claimableVeOgv / 4) * votingDecayFactor ** (48 / 12);

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

  let claimButtonText = "";
  if (claim.mandatory.state === "ready") {
    claimButtonText = "Lock OGV & claim veOGV";
  } else if (claim.mandatory.state === "waiting-for-user") {
    claimButtonText = "Please confirm transaction";
  } else if (claim.mandatory.state === "waiting-for-network") {
    claimButtonText = "Waiting to be mined";
  } else if (claim.mandatory.state === "claimed") {
    claimButtonText = "Claimed";
  }

  const showModal =
    !hideModal &&
    (claim.mandatory.state === "waiting-for-user" ||
      claim.mandatory.state === "waiting-for-network" ||
      claim.mandatory.state === "claimed");

  return (
    <>
      <Card>
        <div className="space-y-8">
          <div className="space-y-8">
            <h2 className="text-2xl font-bold">
              Total claimable pre-locked OGV
            </h2>
            <CardGroup>
              <Card alt tightPadding noShadow>
                <div className="flex">
                  <div className="flex space-x-[0.4rem] items-end">
                    <TokenIcon large src="/ogv.svg" alt="OGV" />
                    <CardStat large>
                      <TokenAmount amount={claimableVeOgv} />
                    </CardStat>
                    <CardDescription large>OGV</CardDescription>
                  </div>
                </div>
              </Card>
            </CardGroup>
            <CardGroup twoCol horizontal>
              <div className="space-y-2 flex flex-col">
                <span className="text-sm">Lockup periods</span>
                <Card alt tightPadding noShadow>
                  <div className="divide-y space-y-2">
                    <div className="flex">
                      <div className="flex space-x-2 items-end">
                        <CardStat>12</CardStat>
                        <CardDescription large>Months</CardDescription>
                      </div>
                    </div>
                    <div className="flex">
                      <div className="flex space-x-2 items-end pt-2">
                        <CardStat>24</CardStat>
                        <CardDescription large>Months</CardDescription>
                      </div>
                    </div>
                    <div className="flex">
                      <div className="flex space-x-2 items-end pt-2">
                        <CardStat>36</CardStat>
                        <CardDescription large>Months</CardDescription>
                      </div>
                    </div>
                    <div className="flex">
                      <div className="flex space-x-2 items-end pt-2">
                        <CardStat>48</CardStat>
                        <CardDescription large>Months</CardDescription>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
              <div className="space-y-2 flex flex-col">
                <span className="text-sm">Lockup rewards</span>
                <Card tightPadding noShadow dark>
                  <div className="flex items-center">
                    <div className="flex space-x-2 items-end">
                      <CardStat large>
                        {veOgvLockupRewardApy.toFixed(2)}%
                      </CardStat>
                      <CardDescription large>vAPY</CardDescription>
                    </div>
                  </div>
                </Card>
              </div>
            </CardGroup>
            <div className="">
              <CardGroup twoCol horizontal>
                <div className="space-y-2 flex flex-col">
                  <span className="text-sm">You are locking up</span>
                  <Card tightPadding noShadow>
                    <div className="divide-y space-y-2">
                      <div className="flex flex-col relative">
                        <div className="flex space-x-[0.4rem] items-end">
                          <TokenIcon src="/ogv.svg" alt="OGV" />
                          <CardStat>
                            <TokenAmount amount={claimableVeOgv / 4} />
                          </CardStat>
                          <CardDescription large>OGV</CardDescription>
                        </div>
                        <div className="block text-xs italic ml-9 text-gray-400">
                          Unlocks {moment(oneYearFromNow).format("MMM D, YYYY")}
                        </div>
                      </div>
                      <div className="flex flex-col relative pt-2">
                        <div className="flex space-x-[0.4rem] items-end">
                          <TokenIcon src="/ogv.svg" alt="OGV" />
                          <CardStat>
                            <TokenAmount amount={claimableVeOgv / 4} />
                          </CardStat>
                          <CardDescription large>OGV</CardDescription>
                        </div>
                        <div className="block text-xs italic ml-9 text-gray-400">
                          Unlocks{" "}
                          {moment(twoYearsFromNow).format("MMM D, YYYY")}
                        </div>
                      </div>
                      <div className="flex flex-col relative pt-2">
                        <div className="flex space-x-[0.4rem] items-end">
                          <TokenIcon src="/ogv.svg" alt="OGV" />
                          <CardStat>
                            <TokenAmount amount={claimableVeOgv / 4} />
                          </CardStat>
                          <CardDescription large>OGV</CardDescription>
                        </div>
                        <div className="block text-xs italic ml-9 text-gray-400">
                          Unlocks{" "}
                          {moment(threeYearsFromNow).format("MMM D, YYYY")}
                        </div>
                      </div>
                      <div className="flex flex-col relative pt-2">
                        <div className="flex space-x-[0.4rem] items-end">
                          <TokenIcon src="/ogv.svg" alt="OGV" />
                          <CardStat>
                            <TokenAmount amount={claimableVeOgv / 4} />
                          </CardStat>
                          <CardDescription large>OGV</CardDescription>
                        </div>
                        <div className="block text-xs italic ml-9 text-gray-400">
                          Unlocks{" "}
                          {moment(fourYearsFromNow).format("MMM D, YYYY")}
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
                <div className="space-y-2 flex flex-col">
                  <span className="text-sm">You are claiming</span>
                  <Card tightPadding noShadow>
                    <div className="flex">
                      <div className="flex space-x-[0.4rem] items-end">
                        <TokenIcon large src="/veogv.svg" alt="veOGV" />
                        <CardStat large>
                          <TokenAmount amount={veOgvFromVeOgvClaim} />
                        </CardStat>
                        <CardDescription large>veOGV</CardDescription>
                      </div>
                    </div>
                  </Card>
                </div>
                <div className="hidden sm:block absolute h-7 w-7 bg-white border rounded-full left-1/2 top-1/2 -ml-[14px]" />
                <div className="hidden sm:block absolute h-full w-[8px] bg-white left-1/2 top-[20px] -ml-[4px]" />
                <div className="rotate-90 sm:rotate-0 absolute h-7 w-7 left-1/2 top-1/2 mt-[107px] sm:mt-[5px] -ml-[16px] sm:-ml-[8px]">
                  <Icon
                    path={mdiArrowRight}
                    size={0.7}
                    className="text-gray-400"
                  />
                </div>
              </CardGroup>
            </div>
            <div>
              <Button
                onClick={async () => {
                  sethideModal(false);
                  claim.mandatory.claim();
                }}
                disabled={claim.mandatory.state !== "ready"}
                large
                fullWidth
              >
                {claimButtonText}
              </Button>
            </div>
          </div>
        </div>
      </Card>
      <PostClaimModal
        handleClose={sethideModal}
        show={showModal}
        claim={claim.mandatory}
        didLock={true}
        veOgv={veOgvFromVeOgvClaim}
      />
    </>
  );
};

export default ClaimVeOgv;
