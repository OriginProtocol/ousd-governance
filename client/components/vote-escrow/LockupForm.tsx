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
import moment from "moment";
import { SECONDS_IN_A_MONTH } from "../../constants/index";

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
  const { contracts, pendingTransactions, balances, allowances } = useStore();
  const router = useRouter();

  const [lockupAmount, setLockupAmount] = useState("0");
  const [lockupDuration, setLockupDuration] = useState(
    !existingLockup
      ? "0"
      : moment.unix(existingLockup.end).diff(moment(), "months")
  ); // In months

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
    buttonText = existingLockup ? "Extend" : "Lock up";
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
      moment.unix(existingLockup?.end).diff(moment(), "months") ||
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
        { gasLimit: 1000000 }
      ); // @TODO maybe set this to lower
    } catch (e) {
      setTransactionError("Error approving!");
      setApprovalStatus("ready");
      throw e;
    }

    setApprovalStatus("waiting-for-network");

    let receipt;
    try {
      receipt = await contracts.rpcProvider.waitForTransaction(
        transaction.hash
      );
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
      try {
        transaction = await contracts.OgvStaking["stake(uint256,uint256)"](
          ethers.utils.parseUnits(lockupAmount),
          duration,
          { gasLimit: 296559 }
        );
      } catch (e) {
        setTransactionError("Error locking up!");
        setLockupStatus("ready");
        throw e;
      }

      setLockupStatus("waiting-for-network");

      let receipt;
      try {
        receipt = await contracts.rpcProvider.waitForTransaction(
          transaction.hash
        );
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
        receipt = await contracts.rpcProvider.waitForTransaction(
          transaction.hash
        );
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

  return (
    <Card>
      <div className="space-y-2">
        {!existingLockup ? (
          <RangeInput
            label="Lock up"
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
        />
        {transactionError && (
          <div className="p-6 bg-[#dd0a0a1a] border border-[#dd0a0a] rounded-lg text-2xl text-center font-bold text-[#dd0a0a]">
            {transactionError}
          </div>
        )}
        <div className="flex pt-6">
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
