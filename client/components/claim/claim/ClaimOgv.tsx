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
import { getRewardsApy } from "utils/apy";
import { decimal18Bn } from "utils";
import PostClaimModal from "./PostClaimModal";
import Icon from "@mdi/react";
import { mdiAlertCircle, mdiArrowRight } from "@mdi/js";
import ReactTooltip from "react-tooltip";

interface ClaimOgvProps {}

const ClaimOgv: FunctionComponent<ClaimOgvProps> = () => {
  const claim = useClaim();

  const [hideModal, sethideModal] = useState(true);

  const maxLockupDurationInMonths = 12 * 4;
  const [lockupDuration, setLockupDuration] = useState(
    maxLockupDurationInMonths
  );
  const [error, setError] = useState<string>(null);
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
    claimableOgv * votingDecayFactor ** (lockupDuration / 12);
  const ogvLockupRewardApy = getRewardsApy(
    veOgvFromOgvLockup,
    claimableOgv,
    totalSupplyVeOgv
  );
  const maxVeOgvFromOgvLockup = claimableOgv * votingDecayFactor ** (48 / 12);
  const maxOgvLockupRewardApy = getRewardsApy(
    maxVeOgvFromOgvLockup,
    claimableOgv,
    totalSupplyVeOgv
  );

  // const now = new Date();
  // const lockupEnd = new Date(now.getTime() + lockupDuration * 2629746 * 1000); // Months to seconds to miliseconds

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
                  Staking OGV is converted to non-transferable veOGV, which
                  allows you to claim additional OGV and participate in
                  governance.
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
                    <ReactTooltip
                      id="variable-apy"
                      place="right"
                      type="light"
                      effect="solid"
                      borderColor="#dddddd"
                      border
                      className="text-left shadow-xl rounded-2xl w-[230px] mr-4 opaque-tooltip"
                    >
                      <p className="text-sm text-[#626262] py-3">
                        The variable APY indicates the addtional OGV that you
                        would receive over time based on the current number of
                        stakers and inflation schedule. This yield will change
                        as more users stake and OUSD grows.
                      </p>
                    </ReactTooltip>
                    <div>
                      <div
                        data-tip
                        data-for="variable-apy"
                        className="inline-flex space-x-1 items-center sm:justify-end w-auto mb-2"
                      >
                        <span className="text-sm">Variable APY</span>
                        <Icon
                          path={mdiAlertCircle}
                          size={0.75}
                          className="text-secondary mx-auto"
                        />
                      </div>
                    </div>
                    <Card
                      noPadding
                      noShadow
                      red={!isValidLockup}
                      dark={isValidLockup}
                    >
                      <div className="flex p-2 flex-col sm:items-end">
                        <div className="flex space-x-2 items-end">
                          <CardStat large>
                            {isValidLockup ? ogvLockupRewardApy.toFixed(2) : 0}
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
                <div className="space-y-2 flex flex-col">
                  <span className="text-sm">You get</span>
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
                <div className="rotate-90 sm:rotate-0 absolute h-7 w-7 left-1/2 top-1/2 mt-[6px] -ml-[16px] sm:-ml-[8px]">
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
            <div className="p-6 bg-[#dd0a0a1a] border border-[#dd0a0a] rounded-lg text-2xl text-center text-[#dd0a0a]">
              Warning: If you don&apos;t lock your OGV, you&apos;ll miss out on
              the {maxOgvLockupRewardApy.toFixed(2)}% variable APY and maximized
              voting power.
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

                const duration = lockupDuration * 2629746; // Months to seconds

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
