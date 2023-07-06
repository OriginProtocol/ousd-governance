import { FunctionComponent, useState } from "react";
import Card from "components/Card";
import CardGroup from "components/CardGroup";
import TokenIcon from "components/TokenIcon";
import TokenAmount from "components/TokenAmount";
import CardStat from "components/CardStat";
import CardDescription from "components/CardDescription";
import Button from "components/Button";
import RangeInput from "@/components/RangeInput";
import useClaim from "utils/useClaim";
import numeral from "numeraljs";
import { decimal18Bn } from "utils";
import PostClaimModal from "./PostClaimModal";
import Icon from "@mdi/react";
import { mdiArrowRight } from "@mdi/js";
import { SECONDS_IN_A_MONTH } from "../../../constants/index";
import ApyToolTip from "components/claim/claim/ApyTooltip";
import moment from "moment";
import { useStore } from "utils/store";
import useStakingAPY from "utils/useStakingAPY";

interface ClaimOgvProps {}

const ClaimOgv: FunctionComponent<ClaimOgvProps> = () => {
  const claim = useClaim();
  const { totalLockedUpOgv, totalPercentageOfLockedUpOgv } =
    useStore().totalBalances;

  const [hideModal, sethideModal] = useState(true);

  const maxLockupDurationInMonths = 12 * 4;
  const [lockupDuration, setLockupDuration] = useState(
    maxLockupDurationInMonths
  );
  const [error, setError] = useState<string>(null);

  const isValidLockup = lockupDuration > 0;
  const claimableOgv = claim?.optional?.isValid
    ? numeral(claim.optional.amount.div(decimal18Bn).toString()).value()
    : 0;

  const { stakingAPY: ogvLockupRewardApy, loading: ogvLockupRewardLoading } =
    useStakingAPY(claimableOgv, lockupDuration);

  const {
    stakingAPY: maxOgvLockupRewardApy,
    loading: maxOgvLockupRewardLoading,
  } = useStakingAPY(claimableOgv, 48);

  if (!claim.loaded || !claim.optional.hasClaim) {
    return <></>;
  }

  // as specified here: https://github.com/OriginProtocol/ousd-governance/blob/master/contracts/OgvStaking.sol#L21
  const votingDecayFactor = 1.8;

  const veOgvFromOgvLockup =
    claimableOgv * votingDecayFactor ** (lockupDuration / 12);

  let claimButtonText = "";
  if (isValidLockup && claim.optional.state === "ready") {
    claimButtonText = "Claim & Stake OGV";
  } else if (claim.optional.state === "ready") {
    claimButtonText = "Claim OGV";
  } else if (claim.optional.state === "waiting-for-user") {
    claimButtonText = "Please confirm transaction";
  } else if (claim.optional.state === "waiting-for-network") {
    claimButtonText = "Waiting to be mined";
  } else if (claim.optional.state === "claimed") {
    claimButtonText = "Claimed";
  }

  const showModal =
    !hideModal &&
    (claim.optional.state === "waiting-for-user" ||
      claim.optional.state === "waiting-for-network" ||
      claim.optional.state === "claimed");

  const now = new Date();

  return (
    <>
      <Card>
        <div className="space-y-7">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Total claimable OGV</h2>
            <Card alt tightPadding noShadow>
              <div className="flex">
                <div className="flex space-x-[0.4rem] items-end">
                  <TokenIcon large src="/ogv.svg" alt="OGV" />
                  <CardStat large>
                    <TokenAmount amount={claimableOgv} />
                  </CardStat>
                  <CardDescription large>OGV</CardDescription>
                </div>
              </div>
            </Card>
          </div>
          <div className="space-y-8">
            <div className="space-y-6">
              <div className="space-y-3">
                <h2 className="text-2xl font-bold">
                  Stake your OGV to get maximum rewards and voting power
                </h2>
                <p className="text-gray-500 text-lg leading-snug">
                  Staked OGV is converted to non-transferable veOGV, which
                  allows you to claim additional OGV staking rewards, OUSD fees,
                  and participate in governance.
                </p>
              </div>
              <div className="space-y-6">
                <CardGroup horizontal twoCol>
                  <div className="space-y-2 flex flex-col sm:w-2/3">
                    <span className="text-sm">Stake duration</span>
                    <Card alt noPadding noShadow>
                      <div className="flex p-2">
                        <div className="flex space-x-2 items-end">
                          <CardStat large>{lockupDuration}</CardStat>
                          <CardDescription large>Months</CardDescription>
                        </div>
                      </div>
                    </Card>
                  </div>
                  <div className="flex flex-col sm:text-right sm:w-2/3 sm:ml-auto">
                    <ApyToolTip />
                    <Card
                      noPadding
                      noShadow
                      red={!isValidLockup}
                      dark={isValidLockup}
                    >
                      <div className="flex p-2 flex-col sm:items-end">
                        <div className="flex space-x-2 items-end">
                          <CardStat large>
                            {isValidLockup
                              ? ogvLockupRewardLoading
                                ? "--.--"
                                : ogvLockupRewardApy.toFixed(2)
                              : 0}
                          </CardStat>
                          <CardDescription large>%</CardDescription>
                        </div>
                      </div>
                    </Card>
                  </div>
                </CardGroup>
                <div>
                  <RangeInput
                    label=""
                    counterUnit=""
                    min="0"
                    max={maxLockupDurationInMonths}
                    value={lockupDuration}
                    onChange={(e) => {
                      setLockupDuration(e.target.value);
                    }}
                    hideLabel
                    markers={[
                      {
                        label: "0",
                        value: 0,
                      },
                      {
                        label: "",
                        value: 0,
                      },
                      {
                        label: "1 yr",
                        value: 12,
                      },
                      {
                        label: "",
                        value: 0,
                      },
                      {
                        label: "2 yrs",
                        value: 24,
                      },
                      {
                        label: "",
                        value: 0,
                      },
                      {
                        label: "3 yrs",
                        value: 36,
                      },
                      {
                        label: "",
                        value: 0,
                      },
                      {
                        label: "4 yrs",
                        value: 48,
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
            </div>
          </div>
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Your claim summary</h2>
            {!isValidLockup ? (
              <div className="space-y-2 flex flex-col">
                <span className="text-sm">You are claiming</span>
                <Card tightPadding noShadow>
                  <div className="flex">
                    <div className="flex space-x-[0.4rem] items-end">
                      <TokenIcon large src="/ogv.svg" alt="OGV" />
                      <CardStat large>
                        <TokenAmount amount={claimableOgv} />
                      </CardStat>
                      <CardDescription large>OGV</CardDescription>
                    </div>
                  </div>
                </Card>
              </div>
            ) : (
              <CardGroup horizontal twoCol>
                <div className="space-y-2 flex flex-col">
                  <span className="text-sm">You are staking</span>
                  <Card tightPadding noShadow>
                    <div className="flex flex-col">
                      <div className="flex space-x-[0.4rem] items-end">
                        <TokenIcon large src="/ogv.svg" alt="OGV" />
                        <CardStat large>
                          <TokenAmount amount={claimableOgv} />
                        </CardStat>
                        <CardDescription large>OGV</CardDescription>
                      </div>
                      <div className="block text-xs italic ml-11 mt-1 text-gray-400">
                        Unlocks{" "}
                        {moment(
                          now.getTime() +
                            lockupDuration * SECONDS_IN_A_MONTH * 1000
                        ).format("MMM D, YYYY")}
                      </div>
                    </div>
                  </Card>
                </div>
                <div className="space-y-2 flex flex-col">
                  <span className="text-sm">Today you get</span>
                  <Card tightPadding noShadow>
                    <div className="flex">
                      <div className="flex space-x-[0.4rem] items-end">
                        <TokenIcon large src="/veogv.svg" alt="veOGV" />
                        <CardStat large>
                          <TokenAmount amount={veOgvFromOgvLockup} />
                        </CardStat>
                        <CardDescription large>veOGV</CardDescription>
                      </div>
                    </div>
                  </Card>
                </div>
                <div className="hidden sm:block absolute h-7 w-7 bg-white border rounded-full left-1/2 top-1/2 -ml-[14px]" />
                <div className="hidden sm:block absolute h-full w-[8px] bg-white left-1/2 top-[20px] -ml-[4px]" />
                <div className="rotate-90 sm:rotate-0 absolute h-7 w-7 left-1/2 top-1/2 mt-[15px] sm:mt-[6px] -ml-[16px] sm:-ml-[8px]">
                  <Icon
                    path={mdiArrowRight}
                    size={0.66}
                    className="text-gray-400"
                  />
                </div>
              </CardGroup>
            )}
          </div>
          {!isValidLockup && (
            <div className="p-6 bg-[#dd0a0a1a] border border-[#dd0a0a] rounded-lg text-xl text-center text-[#dd0a0a]">
              If you don&apos;t stake your OGV, you&apos;ll miss out on the{" "}
              {maxOgvLockupRewardLoading
                ? "--.--"
                : maxOgvLockupRewardApy.toFixed(2)}
              % variable APY and maximized voting power.{" "}
              <TokenAmount amount={totalLockedUpOgv} format="currency" /> OGV (
              {totalPercentageOfLockedUpOgv.toFixed(2)}% of the total supply)
              has already been staked by other users.
            </div>
          )}
          {error && (
            <div className="p-6 bg-[#dd0a0a1a] border border-[#dd0a0a] rounded-lg text-2xl text-center font-bold text-[#dd0a0a]">
              {error}
            </div>
          )}
          <div>
            <Button
              onClick={async () => {
                sethideModal(false);
                setError(null);

                const duration = lockupDuration * SECONDS_IN_A_MONTH; // Months to seconds

                try {
                  const receipt = await claim.optional.claim(duration);

                  if (receipt.status === 0) {
                    setError("Error claiming tokens!");
                  }
                } catch (e) {
                  setError("Error claiming tokens!", e);
                  throw e;
                }
              }}
              disabled={claim.optional.state !== "ready"}
              large
              fullWidth
              red={!isValidLockup}
            >
              {claimButtonText}
            </Button>
          </div>
        </div>
      </Card>
      <PostClaimModal
        handleClose={sethideModal}
        show={showModal}
        claim={claim.optional}
        didLock={isValidLockup}
        veOgv={veOgvFromOgvLockup}
      />
    </>
  );
};

export default ClaimOgv;
