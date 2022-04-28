import { ethers } from "ethers";
import { useEffect, useState } from "react";
import { useStore } from "utils/store";
import { PageTitle } from "components/PageTitle";
import { Disconnected } from "components/Disconnected";
import CardGroup from "components/CardGroup";
import Card from "components/Card";
import CardLabel from "components/CardLabel";
import CardStat from "components/CardStat";
import CardDescription from "components/CardDescription";
import { truncateBalance, useNetworkInfo } from "utils/index";
import { toast } from "react-toastify";
import useAccountBalances from "utils/useAccountBalances";
import TokenAmount from "components/TokenAmount";

const MAX_WEEKS = 52 * 4;

export default function VoteEscrow({}) {
  const {
    web3Provider,
    address,
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
  const networkInfo = useNetworkInfo();
  const { reloadAllowances, reloadBalances } = useAccountBalances();

  useEffect(() => {
    if (existingLockup.end.gt(0)) {
      setAmount(ethers.utils.formatUnits(existingLockup.amount.toString()));
      setWeeks(existingLockup.existingEndWeeks);
    }
  }, [
    existingLockup.end,
    existingLockup.amount,
    existingLockup.existingEndWeeks,
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

  const amountInputModified =
    amount > ethers.utils.formatUnits(existingLockup.amount.toString());
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
      contracts.VoteLockerCurve.address,
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
      const end = now + weeks * 7 * 86400;
      const transaction = await contracts.VoteLockerCurve.lockup(
        ethers.utils.parseUnits(amount),
        end
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
    <>
      <PageTitle>Vote Escrow</PageTitle>
      <CardGroup>
        <CardGroup horizontal fourCol>
          <div>
            <Card dark tightPadding>
              <div className="space-y-1">
                <CardLabel>Balance</CardLabel>
                <CardStat>
                  <TokenAmount amount={balances.ogv} />
                </CardStat>
                <CardDescription>OGV</CardDescription>
              </div>
            </Card>
          </div>
          <div>
            <Card dark tightPadding>
              <div className="space-y-1">
                <CardLabel>Vote Balance</CardLabel>
                <CardStat>
                  <TokenAmount amount={balances.vote_power} />
                </CardStat>
                <CardDescription>veOGV</CardDescription>
              </div>
            </Card>
          </div>
          <div>
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
            </Card>
          </div>
        </CardGroup>
        <Card>
          <div className="space-y-4">
            <div>
              <label className="label">
                <span className="label-text text-lg font-bold">
                  Lockup amount
                </span>
              </label>
              <div className="input-group">
                {existingLockup.end.gt(0) && (
                  <button
                    className="btn"
                    onClick={() =>
                      setAmount(
                        ethers.utils.formatUnits(
                          existingLockup.amount.toString()
                        )
                      )
                    }
                  >
                    Min
                  </button>
                )}
                <input
                  type="number"
                  min={
                    existingLockup.end.gt(0)
                      ? ethers.utils.formatUnits(
                          existingLockup.amount.toString()
                        )
                      : 1
                  }
                  max={balances.ogv.toString()}
                  placeholder="Amount"
                  className={`text-lg input input-bordered w-full border-2 ${
                    amountError && "input-error"
                  }`}
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setAmountError("");
                  }}
                />
                <button
                  className="btn"
                  onClick={() =>
                    setAmount(ethers.utils.formatUnits(balances.ogv.toString()))
                  }
                >
                  Max
                </button>
              </div>
              {existingLockup.end.gt(0) && !bothInputsModified && (
                <div className="pt-4 flex w-1/2">
                  <button
                    className="btn btn-primary md:btn-lg rounded-full w-full"
                    disabled={amount <= existingLockup.amount}
                    onClick={handleLockup}
                  >
                    Increase lockup amount
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
              <label className="label">
                <span className="label-text text-lg font-bold flex justify-between items-center w-full">
                  <span>Lockup length</span>
                  <span className="text-sm text-gray-500">{weeks} weeks</span>
                </span>
              </label>
              <div>
                <input
                  className="range range-lg range-accent"
                  type="range"
                  min="0"
                  max="208"
                  value={weeks}
                  onChange={(e) => {
                    setWeeks(parseInt(e.target.value.replace(/\D+/g, "")));
                    setEndError("");
                  }}
                />
                <div className="w-full flex justify-between text-xs text-gray-400 px-3">
                  <span>|</span>
                  <span>|</span>
                  <span>|</span>
                  <span>|</span>
                  <span>|</span>
                  <span>|</span>
                  <span>|</span>
                  <span>|</span>
                  <span>|</span>
                </div>
                <div className="w-full flex justify-between text-xs text-gray-400 pt-1">
                  <span>0 wks</span>
                  <span>&nbsp;</span>
                  <span>1 yr</span>
                  <span>&nbsp;</span>
                  <span>2 yrs</span>
                  <span>&nbsp;</span>
                  <span>3 yrs</span>
                  <span>&nbsp;</span>
                  <span>4 yrs</span>
                </div>
              </div>
              {existingLockup.end.gt(0) && !bothInputsModified && (
                <div className="pt-4 flex w-1/2">
                  <button
                    className="btn btn-primary md:btn-lg rounded-full w-full"
                    disabled={weeks <= existingLockup.existingEndWeeks}
                    onClick={handleLockup}
                  >
                    Extend lockup length
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
              <button
                className="btn btn-primary md:btn-lg rounded-full w-full"
                onClick={handleLockup}
              >
                Modify lockup
              </button>
            )}
            {estimatedVotePower && (
              <div className="pt-2 text-lg">
                <span className="font-bold pr-2">Estimated votes</span>{" "}
                {estimatedVotePower}
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
        </Card>
      </CardGroup>
    </>
  );
}
