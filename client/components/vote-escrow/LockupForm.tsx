import { FunctionComponent } from "react";
import { ethers } from "ethers";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useStore } from "utils/store";
import Card from "components/Card";
import { toast } from "react-toastify";
import useAccountBalances from "utils/useAccountBalances";
import Link from "components/Link";
import RangeInput from "components/RangeInput";
import useLockups from "utils/useLockups";
import useTotalBalances from "utils/useTotalBalances";

interface LockupFormProps {}

const lockupAmountInputMarkers = [
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
];
const lockupDurationInputMarkers = [
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
];

const maxLockupDurationInWeeks = 52 * 4;

const LockupForm: FunctionComponent<LockupFormProps> = () => {
  const { web3Provider, contracts, pendingTransactions, balances, allowances } =
    useStore();
  const router = useRouter();

  const [lockupAmount, setLockupAmount] = useState("0");
  const [lockupDuration, setLockupDuration] = useState("0"); // In weeks
  const [lockupAmountError, setLockupAmountError] = useState("");
  const [lockupDurationError, setLockupDurationError] = useState("");

  const { reloadTotalBalances } = useTotalBalances();
  const { reloadAccountAllowances, reloadAccountBalances } =
    useAccountBalances();
  const { reloadLockups } = useLockups();

  const formattedOgvBalance = Number(
    ethers.utils.formatUnits(balances.ogv.toString())
  )
    .toFixed()
    .toString();

  const validateForm = async () => {
    if (lockupDuration > maxLockupDurationInWeeks) {
      setLockupDurationError(
        `Can not lockup for more than ${maxLockupDurationInWeeks} weeks`
      );
      return false;
    }

    return true;
  };

  const handleApproval = async () => {
    const transaction = await contracts.OriginDollarGovernance.approve(
      contracts.OgvStaking.address,
      ethers.constants.MaxUint256,
      { gasLimit: 1000000 }
    ); // @TODO maybe set this to lower

    useStore.setState({
      pendingTransactions: [
        ...pendingTransactions,
        {
          ...transaction,
          onComplete: () => {
            toast.success("Approval has been made", { hideProgressBar: true }),
              reloadAccountAllowances();
          },
        },
      ],
    });
  };

  const handleLockup = async () => {
    const valid = await validateForm();

    if (valid) {
      const now = (await web3Provider.getBlock()).timestamp;
      const duration = lockupDuration * 7 * 86400;

      const transaction = await contracts.OgvStaking["stake(uint256,uint256)"](
        ethers.utils.parseUnits(lockupAmount),
        duration,
        { gasLimit: 1000000 }
      ); // @TODO maybe set this to lower
      useStore.setState({
        pendingTransactions: [
          ...pendingTransactions,
          {
            ...transaction,
            onComplete: () => {
              toast.success("Lockup confirmed", {
                hideProgressBar: true,
              });
              reloadTotalBalances();
              reloadAccountBalances();
              reloadLockups();
              router.push(`/vote-escrow`);
            },
          },
        ],
      });
    }
  };

  return (
    <Card>
      <div className="space-y-2">
        <RangeInput
          label="Lock up"
          counterUnit="OGV"
          min="1"
          max={formattedOgvBalance}
          value={lockupAmount}
          onChange={(e) => {
            setLockupAmount(e.target.value);
          }}
          markers={lockupAmountInputMarkers}
          onMarkerClick={(markerValue) => {
            if (markerValue) {
              setLockupAmount(
                ((formattedOgvBalance / 100) * markerValue).toString()
              );
            }
          }}
        />
        <RangeInput
          label="For"
          counterUnit="weeks"
          min="1"
          max={maxLockupDurationInWeeks}
          value={lockupDuration}
          onChange={(e) => {
            setLockupDuration(e.target.value);
          }}
          markers={lockupDurationInputMarkers}
          onMarkerClick={(markerValue) => {
            if (markerValue) {
              setLockupDuration(markerValue);
            }
          }}
        />
        <div className="flex pt-6">
          <button
            className="btn btn-primary md:btn-lg rounded-full mr-4 flex-1"
            disabled={
              !lockupAmount ||
              !lockupDuration ||
              allowances.ogv.gte(ethers.utils.parseUnits(lockupAmount))
            }
            onClick={handleApproval}
          >
            Approve Transfer
          </button>
          <button
            className="btn btn-primary md:btn-lg rounded-full flex-1"
            disabled={
              !lockupAmount ||
              !lockupDuration ||
              ethers.utils.parseUnits(lockupAmount).gt(allowances.ogv)
            }
            onClick={handleLockup}
          >
            Lockup
          </button>
        </div>
      </div>
    </Card>
  );

  return (
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
                      ethers.utils.formatUnits(existingLockup.amount.toString())
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
  );
};

export default LockupForm;
