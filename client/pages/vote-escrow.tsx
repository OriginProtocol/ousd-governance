import { ethers } from "ethers";
import { useState, useEffect } from "react";
import { useStore } from "utils/store";
import { PageTitle } from "components/PageTitle";
import { Disconnected } from "components/Disconnected";
import CardGroup from "components/CardGroup";
import Card from "components/Card";
import CardLabel from "components/CardLabel";
import CardStat from "components/CardStat";
import CardDescription from "components/CardDescription";
import { useNetworkInfo } from "utils/index";
import LockupStats from "components/vote-escrow/LockupStats";
import prisma from "lib/prisma";
import { toast } from "react-toastify";
import useAccountBalances from "utils/useAccountBalances";
import TokenIcon from "components/TokenIcon";
import TokenAmount from "components/TokenAmount";
import Link from "components/Link";
import RangeInput from "components/vote-escrow/RangeInput";
import Wrapper from "components/Wrapper";

const MAX_WEEKS = 52 * 4;

export async function getServerSideProps({ res }: { res: any }) {
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=60, stale-while-revalidate=59"
  );

  const lockups = await prisma.lockup.findMany({
    where: {
      active: {
        equals: true,
      },
    },
  });
  const lockupCount = lockups.length;
  const totalLockupWeeks = lockups.reduce(
    (total: Number, lockup: Object) => total + lockup.weeks,
    0
  );
  const totalTokensLockedUp = lockups.reduce(
    (total: Number, lockup: Object) => total + lockup.amount,
    0
  );

  return {
    props: {
      lockupCount,
      totalLockupWeeks,
      totalTokensLockedUp,
    },
  };
}

export default function VoteEscrow({
  lockupCount,
  totalLockupWeeks,
  totalTokensLockedUp,
}) {
  const {
    web3Provider,
    contracts,
    pendingTransactions,
    balances,
    allowances,
    existingLockup,
  } = useStore();

  const [amount, setAmount] = useState("0");
  const [weeks, setWeeks] = useState(0);
  const [amountError, setAmountError] = useState("");
  const [endError, setEndError] = useState("");
  const { reloadAllowances, reloadBalances } = useAccountBalances();

  const existingLockupAmount = Number(
    ethers.utils.formatUnits(existingLockup.amount.toString())
  )
    .toFixed()
    .toString();

  useEffect(() => {
    if (existingLockup.end.gt(0)) {
      setAmount(existingLockupAmount);
      setWeeks(existingLockup.existingEndWeeks);
    }
  }, [
    existingLockup.end,
    existingLockup.existingEndWeeks,
    existingLockupAmount,
  ]);

  if (!web3Provider) {
    return <Disconnected />;
  }

  let estimatedVotePower;
  if (amount && weeks) {
    estimatedVotePower = ethers.utils.formatUnits(
      ethers.utils.parseUnits(amount).mul(weeks).div(MAX_WEEKS)
    );
  }

  const amountInputModified = parseInt(amount) > parseInt(existingLockupAmount);
  const lengthInputModified = weeks !== existingLockup.existingEndWeeks;
  const bothInputsModified = amountInputModified && lengthInputModified;

  const validate = async () => {
    if (
      amountInputModified &&
      ethers.utils.parseUnits(amount).lte(existingLockup.amount)
    ) {
      setAmountError("Amount must be greater than existing lockup amount");
      return false;
    }

    if (lengthInputModified) {
      const now = (await web3Provider.getBlock()).timestamp;
      if (now + weeks * 7 * 86400 < existingLockup.end) {
        setEndError("End date must be greater than existing lockup end date");
        return false;
      }

      if (weeks > MAX_WEEKS) {
        setEndError(`Can not lockup for more than ${MAX_WEEKS} weeks`);
        return false;
      }
    }

    return true;
  };

  const handleApproval = async () => {
    const transaction = await contracts.OriginDollarGovernance.approve(
      contracts.OgvStaking.address,
      ethers.constants.MaxUint256
    );

    useStore.setState({
      pendingTransactions: [
        ...pendingTransactions,
        {
          ...transaction,
          onComplete: () => {
            toast.success("Approval has been made", { hideProgressBar: true }),
              reloadAllowances();
          },
        },
      ],
    });
  };

  const handleLockup = async () => {
    const valid = await validate();
    if (valid) {
      const now = (await web3Provider.getBlock()).timestamp;
      const duration = weeks * 7 * 86400;

      const transaction = await contracts.OgvStaking["stake(uint256,uint256)"](
        ethers.utils.parseUnits(amount),
        duration
      );
      useStore.setState({
        pendingTransactions: [
          ...pendingTransactions,
          {
            ...transaction,
            onComplete: () => {
              toast.success("Lockup confirmed", {
                hideProgressBar: true,
              });
              reloadBalances();
            },
          },
        ],
      });
    }
  };

  return (
    <Wrapper narrow>
      <PageTitle>Vote Escrow</PageTitle>
      <CardGroup>
        <CardGroup horizontal fourCol>
          <div>
            <Card dark tightPadding>
              <div className="space-y-1">
                <CardLabel>Balance</CardLabel>
                <div className="flex space-x-1 items-center">
                  <TokenIcon src="/ogv.svg" alt="OGV" />
                  <CardStat>
                    <TokenAmount amount={balances.ogv} />
                  </CardStat>
                </div>
                <CardDescription>OGV</CardDescription>
              </div>
            </Card>
          </div>
          <div>
            <Card dark tightPadding>
              <div className="space-y-1">
                <CardLabel>Vote Balance</CardLabel>
                <div className="flex space-x-1 items-center">
                  <TokenIcon src="/veogv.svg" alt="veOGV" />
                  <CardStat>
                    <TokenAmount amount={balances.veOgv} />
                  </CardStat>
                </div>
                <CardDescription>veOGV</CardDescription>
              </div>
            </Card>
          </div>
          {/*<div>
            <Card dark tightPadding>
              <div className="space-y-1">
                <CardLabel>Lockup Balance</CardLabel>
                <CardStat>
                  <TokenAmount amount={existingLockup.amount} />
                </CardStat>
                <CardDescription>OGV</CardDescription>
              </div>
            </Card>
          </div>
          <div>
            <Card dark tightPadding>
              <div className="space-y-1">
                <CardLabel>Lockup End</CardLabel>
                <CardStat>
                  {existingLockup.existingEndWeeks
                    ? existingLockup.existingEndWeeks
                    : 0}{" "}
                  weeks
                </CardStat>
                {existingLockup.end.gt(0) && (
                  <CardDescription>
                    {existingLockup.existingEndDate}
                  </CardDescription>
                )}
              </div>
                </div>*/}
        </CardGroup>
        <Card>
          {balances.ogv.gt(0) ? (
            <div className="space-y-4">
              {existingLockup.end.gt(0) && (
                <p className="text-sm text-gray-600">
                  You have an existing lockup. You can increase the amount, the
                  length, or both.
                </p>
              )}
              <div>
                <RangeInput
                  label="Lockup amount"
                  counterUnit="OGV"
                  min={"1"}
                  max={Number(
                    ethers.utils.formatUnits(
                      balances.ogv.add(existingLockup.amount).toString()
                    )
                  )
                    .toFixed()
                    .toString()}
                  value={amount}
                  markers={[
                    "0%",
                    "",
                    "20%",
                    "",
                    "40%",
                    "",
                    "60%",
                    "",
                    "80%",
                    "",
                    "100%",
                  ]}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setAmountError("");
                  }}
                />
                {existingLockup.end.gt(0) && !bothInputsModified && (
                  <div className="pt-4 flex">
                    <button
                      className="btn btn-primary md:btn-lg rounded-full mr-4 flex-1"
                      disabled={
                        parseInt(amount) <=
                        parseInt(
                          Number(
                            ethers.utils.formatUnits(
                              existingLockup.amount.toString()
                            )
                          )
                            .toFixed()
                            .toString()
                        )
                      }
                      onClick={handleLockup}
                    >
                      Increase lockup amount
                    </button>
                    <button
                      className="btn btn-neutral md:btn-lg rounded-full flex-1"
                      disabled={
                        parseInt(amount) ===
                        parseInt(
                          Number(
                            ethers.utils.formatUnits(
                              existingLockup.amount.toString()
                            )
                          )
                            .toFixed()
                            .toString()
                        )
                      }
                      onClick={() => {
                        setAmount(
                          Number(
                            ethers.utils.formatUnits(
                              existingLockup.amount.toString()
                            )
                          )
                            .toFixed()
                            .toString()
                        );
                      }}
                    >
                      Reset
                    </button>
                  </div>
                )}
                {amountError && (
                  <label className="label">
                    <span className="label-text-alt text-error-content">
                      {amountError}
                    </span>
                  </label>
                )}
              </div>
              <div>
                <RangeInput
                  label="Lockup length"
                  counterUnit="weeks"
                  min="0"
                  max="208"
                  value={weeks}
                  markers={[
                    "0 wks",
                    "",
                    "1 yr",
                    "",
                    "2 yrs",
                    "",
                    "3 yrs",
                    "",
                    "4 yrs",
                  ]}
                  onChange={(e) => {
                    setWeeks(parseInt(e.target.value.replace(/\D+/g, "")));
                    setEndError("");
                  }}
                />
                {existingLockup.end.gt(0) && !bothInputsModified && (
                  <div className="pt-4 flex">
                    <button
                      className="btn btn-primary md:btn-lg rounded-full mr-4 flex-1"
                      disabled={weeks <= existingLockup.existingEndWeeks}
                      onClick={handleLockup}
                    >
                      Extend lockup length
                    </button>
                    <button
                      className="btn btn-neutral md:btn-lg rounded-full flex-1"
                      disabled={weeks === existingLockup.existingEndWeeks}
                      onClick={() => {
                        setWeeks(existingLockup.existingEndWeeks);
                      }}
                    >
                      Reset
                    </button>
                  </div>
                )}
                {endError && (
                  <label className="label">
                    <span className="label-text-alt text-error-content">
                      {endError}
                    </span>
                  </label>
                )}
              </div>
              {existingLockup.end.gt(0) && bothInputsModified && (
                <div className="pt-4 flex">
                  <button
                    className="btn btn-primary md:btn-lg rounded-full mr-4 flex-1"
                    onClick={handleLockup}
                  >
                    Modify lockup
                  </button>
                  <button
                    className="btn btn-neutral md:btn-lg rounded-full flex-1"
                    onClick={() => {
                      setAmount(
                        Number(
                          ethers.utils.formatUnits(
                            existingLockup.amount.toString()
                          )
                        )
                          .toFixed()
                          .toString()
                      );
                      setWeeks(existingLockup.existingEndWeeks);
                    }}
                  >
                    Reset
                  </button>
                </div>
              )}
              {estimatedVotePower && (
                <div className="pt-2 text-lg">
                  <span className="font-bold pr-2">Estimated votes</span>{" "}
                  {ethers.utils.commify(Number(estimatedVotePower).toFixed())}
                </div>
              )}
              {!existingLockup.end.gt(0) && (
                <div className="flex py-3">
                  <button
                    className="btn btn-primary md:btn-lg rounded-full mr-4 flex-1"
                    disabled={
                      !amount ||
                      !weeks ||
                      allowances.ogv.gte(ethers.utils.parseUnits(amount))
                    }
                    onClick={handleApproval}
                  >
                    Approve Transfer
                  </button>
                  <button
                    className="btn btn-primary md:btn-lg rounded-full flex-1"
                    disabled={
                      !amount ||
                      !weeks ||
                      ethers.utils.parseUnits(amount).gt(allowances.ogv)
                    }
                    onClick={handleLockup}
                  >
                    Lockup
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <p>You need OGV to be able to participate in governance.</p>
              <div>
                <Link
                  className="btn btn-primary md:btn-lg rounded-full"
                  href="https://app.uniswap.org/#/swap?chain=mainnet"
                  type="external"
                  newWindow
                >
                  Get OGV from Uniswap
                </Link>
              </div>
            </div>
          )}
        </Card>
        <LockupStats
          lockupCount={lockupCount}
          totalLockupWeeks={totalLockupWeeks}
          totalTokensLockedUp={totalTokensLockedUp}
        />
      </CardGroup>
    </Wrapper>
  );
}
