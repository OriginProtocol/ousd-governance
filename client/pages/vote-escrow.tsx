import { ethers } from "ethers";
import { useEffect, useState } from "react";
import { useStore } from "utils/store";
import { PageTitle } from "components/PageTitle";
import { Disconnected } from "components/Disconnected";
import { truncateBalance, useNetworkInfo } from "utils/index";
import { toast } from "react-toastify";

const MAX_WEEKS = 52 * 4;

export default function VoteEscrow({}) {
  const { web3Provider, address, contracts, pendingTransactions } = useStore();
  const [amount, setAmount] = useState("0");
  const [weeks, setWeeks] = useState(0);
  const [balance, setBalance] = useState(0);
  const [votePower, setVotePower] = useState(0);
  const [approval, setApproval] = useState(0);
  const [existingAmount, setExistingAmount] = useState(
    ethers.BigNumber.from(0)
  );
  const [existingEnd, setExistingEnd] = useState(ethers.BigNumber.from(0));
  const [existingEndWeeks, setExistingEndWeeks] = useState(0);
  const [amountError, setAmountError] = useState("");
  const [endError, setEndError] = useState("");
  const [reload, setReload] = useState(false);
  const networkInfo = useNetworkInfo();

  // Load users governance token balance
  useEffect(() => {
    const loadBalance = async () => {
      const balance = await contracts.OriginDollarGovernance.balanceOf(address);
      setBalance(balance);
    };
    if (web3Provider && address && networkInfo.correct && contracts.loaded) {
      loadBalance();
    }
  }, [address, web3Provider, contracts, reload, networkInfo.correct]);

  // Load users vote power
  useEffect(() => {
    const loadVotePower = async () => {
      const votePower = await contracts.VoteLockerCurve.balanceOf(address);
      setVotePower(votePower);
    };
    if (web3Provider && address && networkInfo.correct && contracts.loaded) {
      loadVotePower();
    }
  }, [address, web3Provider, contracts, reload, networkInfo.correct]);

  // Load the amount of governance token approved by the user for transfer by vl contract
  useEffect(() => {
    const loadApproval = async () => {
      const approval = await contracts.OriginDollarGovernance.allowance(
        address,
        contracts.VoteLockerCurve.address
      );
      setApproval(approval);
    };
    if (web3Provider && address && networkInfo.correct && contracts.loaded) {
      loadApproval();
    }
  }, [address, web3Provider, contracts, reload, networkInfo.correct]);

  // Load users existing lockup in case this is an extension
  useEffect(() => {
    const loadExistingLockup = async () => {
      const lockup = await contracts.VoteLockerCurve.getLockup(address);
      setExistingAmount(lockup[0]);
      setExistingEnd(lockup[1]);
    };
    if (web3Provider && address && networkInfo.correct && contracts.loaded) {
      loadExistingLockup();
    }
  }, [address, web3Provider, contracts, networkInfo.correct, reload]);

  // Calculate the number of weeks to existing lockup end (if one exists)
  useEffect(() => {
    const lockupEndToWeeks = async (end: ethers.BigNumber) => {
      const now = (await web3Provider.getBlock()).timestamp;
      setExistingEndWeeks(end.sub(now).div(604800).toNumber());
    };
    if (web3Provider && address && existingEnd.gt(0)) {
      lockupEndToWeeks(existingEnd);
    }
  }, [address, existingEnd, web3Provider, reload]);

  if (!web3Provider) {
    return <Disconnected />;
  }

  let estimatedVotePower;
  if (amount && weeks) {
    estimatedVotePower = ethers.utils.formatUnits(
      ethers.utils.parseUnits(amount).mul(weeks).div(MAX_WEEKS)
    );
  }

  const validate = async () => {
    if (ethers.utils.parseUnits(amount).lte(existingAmount)) {
      setAmountError("Amount must be greater than existing lockup amount");
      return false;
    }
    const now = (await web3Provider.getBlock()).timestamp;
    if (now + weeks * 7 * 86400 < existingEnd) {
      setEndError("End date must be greater than existing lockup end date");
      return false;
    }
    return true;
  };

  const handleApproval = async () => {
    const transaction = await contracts.OriginDollarGovernance.approve(
      contracts.VoteLockerCurve.address,
      ethers.utils.parseUnits(amount)
    );

    useStore.setState({
      pendingTransactions: [
        ...pendingTransactions,
        {
          ...transaction,
          onComplete: () => {
            toast.success("Approval has been made", { hideProgressBar: true }),
              setReload(!reload);
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
              toast.success("Approval has been made", {
                hideProgressBar: true,
              });
              setReload(!reload);
            },
          },
        ],
      });
    }
  };

  return (
    <>
      <PageTitle>Vote Escrow</PageTitle>

      <div className="grid content-center">
        <div className="stats shadow mb-16">
          <div className="stat">
            <div className="stat-title">Balance</div>
            <div className="stat-value text-primary">
              {truncateBalance(ethers.utils.formatUnits(balance))}
            </div>
            <div className="stat-desc">OGV</div>
          </div>
          <div className="stat">
            <div className="stat-title">Vote Balance</div>
            <div className="stat-value text-info-content">
              {truncateBalance(ethers.utils.formatUnits(votePower))}
            </div>
            <div className="stat-desc">veOGV</div>
          </div>
          <div className="stat">
            <div className="stat-title">Lockup Balance</div>
            <div className="stat-value text-success-content">
              {truncateBalance(ethers.utils.formatUnits(existingAmount))}
            </div>
            <div className="stat-desc">OGV</div>
          </div>
          <div className="stat">
            <div className="stat-title">Lockup End</div>
            <div className="stat-value">
              {existingEndWeeks ? existingEndWeeks : 0}
            </div>
            <div className="stat-desc">Weeks</div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto">
        <label className="label">
          <span className="label-text">Lockup amount</span>
        </label>
        <div className="input-group">
          <input
            type="number"
            min={1}
            max={balance.toString()}
            placeholder="Amount"
            className={`input input-bordered w-full ${
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
              setAmount(ethers.utils.formatUnits(balance.toString()))
            }
          >
            Max
          </button>
        </div>
        {amountError && (
          <label className="label">
            <span className="label-text-alt text-error-content">
              {amountError}
            </span>
          </label>
        )}
        <label className="label">
          <span className="label-text">Lockup length (weeks)</span>
        </label>
        <div className="input-group">
          <input
            type="number"
            min="1"
            max={MAX_WEEKS.toString()}
            placeholder="Type here"
            className={`input input-bordered w-full ${
              endError && "input-error"
            }`}
            value={weeks}
            onChange={(e) => {
              setWeeks(e.target.value);
              setEndError("");
            }}
          />
          <button className="btn" onClick={() => setWeeks(MAX_WEEKS)}>
            Max
          </button>
        </div>
        {endError && (
          <label className="label">
            <span className="label-text-alt text-error-content">
              {endError}
            </span>
          </label>
        )}
        {estimatedVotePower && (
          <div className="mt-5">Estimated votes: {estimatedVotePower}</div>
        )}

        <button
          className="btn btn-primary mt-5 mr-5"
          disabled={
            // TODO approval should be new amount - already locked
            !amount || !weeks || approval.gte(ethers.utils.parseUnits(amount))
          }
          onClick={handleApproval}
        >
          Approve Transfer
        </button>

        <button
          className="btn btn-primary mt-5"
          disabled={
            // TODO approval should be new amount - already locked
            !amount || !weeks || ethers.utils.parseUnits(amount).gt(approval)
          }
          onClick={handleLockup}
        >
          Lockup
        </button>
      </div>
    </>
  );
}
