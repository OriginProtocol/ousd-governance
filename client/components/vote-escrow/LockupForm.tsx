import { FunctionComponent } from "react";
import { ethers } from "ethers";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useStore } from "utils/store";
import Card from "components/Card";
import { toast } from "react-toastify";
import useAccountBalances from "utils/useAccountBalances";
import RangeInput from "components/RangeInput";
import useLockups from "utils/useLockups";
import useTotalBalances from "utils/useTotalBalances";
import LockupTable from "components/vote-escrow/LockupTable";
import { SECONDS_IN_A_MONTH } from "../../constants/index";
import TokenIcon from "components/TokenIcon";
import TokenAmount from "components/TokenAmount";
import CardStat from "components/CardStat";
import CardDescription from "components/CardDescription";
import CardGroup from "components/CardGroup";
import moment from "moment";
import { mdiArrowRight, mdiAlertCircle } from "@mdi/js";
import Icon from "@mdi/react";
import ApyToolTip from "components/claim/claim/ApyTooltip";
import { getRewardsApy } from "utils/apy";
import numeral from "numeraljs";
import { decimal18Bn } from "utils";

interface LockupFormProps {
  existingLockup?: Object;
}

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
];

const maxLockupDurationInMonths = 12 * 4;

const LockupForm: FunctionComponent<LockupFormProps> = ({ existingLockup }) => {
  const {
    contracts,
    rpcProvider,
    pendingTransactions,
    balances,
    allowances,
    blockTimestamp,
    totalBalances,
  } = useStore();
  const router = useRouter();

  const { totalSupplyVeOgvAdjusted } = totalBalances;

  const [lockupAmount, setLockupAmount] = useState(
    existingLockup
      ? Math.floor(
          numeral(existingLockup?.amount.div(decimal18Bn).toString())
        ).toString()
      : "0"
  );
  const [lockupDuration, setLockupDuration] = useState(
    !existingLockup
      ? "0"
      : Math.floor((existingLockup.end - blockTimestamp) / SECONDS_IN_A_MONTH)
  ); // In months

  // as specified here: https://github.com/OriginProtocol/ousd-governance/blob/master/contracts/OgvStaking.sol#L21
  const votingDecayFactor = 1.8;

  const veOgvFromOgvLockup =
    lockupAmount * votingDecayFactor ** (lockupDuration / 12);

  const ogvLockupRewardApy = getRewardsApy(
    veOgvFromOgvLockup,
    lockupAmount,
    totalSupplyVeOgvAdjusted
  );

  const validLockup = lockupAmount !== "0" && lockupDuration !== "0";

  const [approvalStatus, setApprovalStatus] = useState("ready");
  const [lockupStatus, setLockupStatus] = useState("ready");

  let approvalButtonText = "";
  if (approvalStatus === "ready") {
    approvalButtonText = "Approve transfer";
  } else if (approvalStatus === "waiting-for-user") {
    approvalButtonText = "Confirm transaction";
  } else if (approvalStatus === "waiting-for-network") {
    approvalButtonText = "Waiting to be mined";
  }

  let buttonText = "";
  if (lockupStatus === "ready") {
    buttonText = existingLockup ? "Extend" : "Stake";
  } else if (lockupStatus === "waiting-for-user") {
    buttonText = "Confirm transaction";
  } else if (lockupStatus === "waiting-for-network") {
    buttonText = "Waiting to be mined";
  }

  const [lockupAmountError, setLockupAmountError] = useState("");
  const [lockupDurationError, setLockupDurationError] = useState("");
  const [transactionError, setTransactionError] = useState("");

  const { reloadTotalBalances } = useTotalBalances();
  const { reloadAccountAllowances, reloadAccountBalances } =
    useAccountBalances();
  const { reloadLockups } = useLockups();

  const formattedOgvBalance = Number(
    ethers.utils.formatUnits(balances.ogv.toString())
  )
    .toFixed()
    .toString();

  const actionDisabledNewLockup =
    lockupAmount === "0" ||
    lockupDuration === "0" ||
    ethers.utils.parseUnits(lockupAmount).gt(allowances.ogv) ||
    lockupStatus === "waiting-for-user" ||
    lockupStatus === "waiting-for-network" ||
    approvalStatus === "waiting-for-user" ||
    approvalStatus === "waiting-for-network";

  const actionDisabledExistingLockup =
    lockupDuration <=
      Math.floor((existingLockup?.end - blockTimestamp) / SECONDS_IN_A_MONTH) ||
    lockupStatus === "waiting-for-user" ||
    lockupStatus === "waiting-for-network" ||
    approvalStatus === "waiting-for-user" ||
    approvalStatus === "waiting-for-network";

  const validateForm = async () => {
    if (lockupDuration > maxLockupDurationInMonths) {
      setLockupDurationError(
        `Can not lockup for more than ${maxLockupDurationInMonths} months`
      );
      return false;
    }

    return true;
  };

  const handleApproval = async () => {
    setTransactionError("");
    setApprovalStatus("waiting-for-user");

    let transaction;
    try {
      transaction = await contracts.OriginDollarGovernance.approve(
        contracts.OgvStaking.address,
        ethers.constants.MaxUint256,
        { gasLimit: 144300 }
      );
    } catch (e) {
      setTransactionError("Error approving!");
      setApprovalStatus("ready");
      throw e;
    }

    setApprovalStatus("waiting-for-network");

    let receipt;
    try {
      receipt = await rpcProvider.waitForTransaction(transaction.hash);
    } catch (e) {
      setTransactionError("Error approving!");
      setApprovalStatus("ready");
      throw e;
    }

    if (receipt.status === 0) {
      setTransactionError("Error approving!");
      setApprovalStatus("ready");
    }

    useStore.setState({
      pendingTransactions: [
        ...pendingTransactions,
        {
          ...transaction,
          onComplete: () => {
            toast.success("Approval has been made", { hideProgressBar: true }),
              reloadAccountAllowances();
            setApprovalStatus("ready");
          },
        },
      ],
    });
  };

  const handleLockup = async () => {
    const valid = await validateForm();

    if (valid) {
      const duration = lockupDuration * SECONDS_IN_A_MONTH; // Months to seconds
      setTransactionError("");
      setLockupStatus("waiting-for-user");

      let transaction;

      // If lockup amount === 100% of the user's OGV balance then use the actual balance BigNumber
      let amountToStake = ethers.utils.parseUnits(lockupAmount);
      if (lockupAmount === formattedOgvBalance) {
        amountToStake = balances.ogv; // Prevents rounding
      }

      try {
        transaction = await contracts.OgvStaking["stake(uint256,uint256)"](
          amountToStake,
          duration,
          // 228123 * 1.5
          { gasLimit: 342184 }
        );
      } catch (e) {
        setTransactionError("Error locking up!");
        setLockupStatus("ready");
        throw e;
      }

      setLockupStatus("waiting-for-network");

      let receipt;
      try {
        receipt = await rpcProvider.waitForTransaction(transaction.hash);
      } catch (e) {
        setTransactionError("Error locking up!");
        setLockupStatus("ready");
        throw e;
      }

      if (receipt.status === 0) {
        setTransactionError("Error locking up!");
        setLockupStatus("ready");
      }

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
              router.push(`/stake`);
              setLockupStatus("ready");
            },
          },
        ],
      });
    }
  };

  const handleExtend = async () => {
    const valid = await validateForm();

    if (valid) {
      const duration = lockupDuration * SECONDS_IN_A_MONTH; // Months to seconds
      setTransactionError("");
      setLockupStatus("waiting-for-user");

      let transaction;
      try {
        transaction = await contracts.OgvStaking["extend(uint256,uint256)"](
          existingLockup.lockupId,
          duration,
          { gasLimit: 195000 }
        );
      } catch (e) {
        setTransactionError("Error extending lockup!");
        setLockupStatus("ready");
        throw e;
      }

      setLockupStatus("waiting-for-network");

      let receipt;
      try {
        receipt = await rpcProvider.waitForTransaction(transaction.hash);
      } catch (e) {
        setTransactionError("Error extending lockup!");
        setLockupStatus("ready");
        throw e;
      }

      if (receipt.status === 0) {
        setTransactionError("Error extending lockup!");
      }

      useStore.setState({
        pendingTransactions: [
          ...pendingTransactions,
          {
            ...transaction,
            onComplete: () => {
              toast.success("Stake extended", {
                hideProgressBar: true,
              });
              reloadTotalBalances();
              reloadAccountBalances();
              reloadLockups();
              router.push(`/stake`);
              setLockupStatus("ready");
            },
          },
        ],
      });
    }
  };

  const now = new Date();

  return (
    <Card>
      <div className="space-y-2">
        {!existingLockup ? (
          <RangeInput
            label="Stake"
            counterUnit="OGV"
            min="0"
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
        ) : (
          <LockupTable lockup={existingLockup} />
        )}
        <RangeInput
          label={!existingLockup ? `For` : `Extend your lockup to`}
          counterUnit="months"
          min={"0"}
          max={maxLockupDurationInMonths}
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
          hideLabelFormatting
        />
        <div className="space-y-6 pt-2 sm:pt-3">
          <div className="flex flex-col sm:text-right sm:w-1/3 sm:ml-auto">
            <ApyToolTip />
            <Card noPadding noShadow red={!validLockup} dark={validLockup}>
              <div className="flex p-2 flex-col sm:items-end">
                <div className="flex space-x-2 items-end">
                  <CardStat large>
                    {validLockup
                      ? ogvLockupRewardApy.toFixed(2)
                      : (0.0).toFixed(2)}
                  </CardStat>
                  <CardDescription large>%</CardDescription>
                </div>
              </div>
            </Card>
          </div>
        </div>
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Your stake summary</h2>
          <CardGroup horizontal twoCol>
            <div className="space-y-2 flex flex-col">
              <span className="text-sm">You are staking</span>
              <Card tightPadding noShadow>
                <div className="flex flex-col">
                  <div className="flex space-x-[0.4rem] items-end">
                    <TokenIcon large src="/ogv.svg" alt="OGV" />
                    <CardStat large>
                      <TokenAmount amount={lockupAmount} />
                    </CardStat>
                    <CardDescription large>OGV</CardDescription>
                  </div>
                  <div className="block text-xs italic ml-11 mt-1 text-gray-400">
                    Unlocks{" "}
                    {moment(
                      parseInt(blockTimestamp) * 1000 +
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
        </div>
        {transactionError && (
          <div className="pt-4">
            <div className="p-6 bg-[#dd0a0a1a] border border-[#dd0a0a] rounded-lg text-2xl text-center font-bold text-[#dd0a0a]">
              {transactionError}
            </div>
          </div>
        )}
        {balances?.accruedRewards.gt(0) && (
          <div className="pt-2">
            <div className="flex space-x-4 bg-gray-100 p-4 pb-5 border-t-4 border-gray-300">
              <Icon
                path={mdiAlertCircle}
                size={1}
                className="text-accent flex-shrink-0"
              />
              <div>
                <span className="block text-md font-bold text-gray-900">
                  OGV rewards will be collected
                </span>
                <span className="block text-sm text-gray-700">
                  You have accrued{" "}
                  {<TokenAmount amount={balances?.accruedRewards} />} OGV in
                  staking rewards. This OGV will be transferred to your wallet
                  immediately when you {existingLockup ? "extend" : "create"}{" "}
                  your stake.
                </span>
              </div>
            </div>
          </div>
        )}
        <div className="flex pt-2">
          <button
            className="btn btn-primary md:btn-lg rounded-full mr-4 flex-1"
            disabled={
              !lockupAmount ||
              !lockupDuration ||
              allowances.ogv.gte(ethers.utils.parseUnits(lockupAmount)) ||
              approvalStatus === "waiting-for-user" ||
              approvalStatus === "waiting-for-network" ||
              lockupStatus === "waiting-for-user" ||
              lockupStatus === "waiting-for-network"
            }
            onClick={handleApproval}
          >
            {approvalButtonText}
          </button>
          <button
            className="btn btn-primary md:btn-lg rounded-full flex-1"
            disabled={
              !existingLockup
                ? actionDisabledNewLockup
                : actionDisabledExistingLockup
            }
            onClick={!existingLockup ? handleLockup : handleExtend}
          >
            {buttonText}
          </button>
        </div>
      </div>
    </Card>
  );
};

export default LockupForm;
