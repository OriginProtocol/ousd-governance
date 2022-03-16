import { ethers } from "ethers";
import { useEffect, useState } from "react";
import { useStore } from "utils/store";
import { PageTitle } from "components/PageTitle";
import { Disconnected } from "components/Disconnected";
import { governanceTokenContract, voteLockerContract } from "constants/index";

const MAX_WEEKS = 52 * 4;

export default function VoteEscrow({}) {
  const { web3Provider, address } = useStore();
  const [amount, setAmount] = useState("0");
  const [weeks, setWeeks] = useState(0);
  const [balance, setBalance] = useState(0);
  const [approval, setApproval] = useState(0);
  const [existingAmount, setExistingAmount] = useState(
    ethers.BigNumber.from(0)
  );
  const [existingEnd, setExistingEnd] = useState(ethers.BigNumber.from(0));
  const [existingEndWeeks, setExistingEndWeeks] = useState(0);
  const [amountError, setAmountError] = useState("");
  const [endError, setEndError] = useState("");

  // Load users governance token balance
  useEffect(() => {
    const loadBalance = async () => {
      const balance = await governanceTokenContract.balanceOf(address);
      setBalance(balance);
    };
    if (web3Provider && address) {
      loadBalance();
    }
  }, [address, web3Provider]);

  // Load the amount of governance token approved by the user for transfer by vl contract
  useEffect(() => {
    const loadApproval = async () => {
      const approval = await governanceTokenContract.allowance(
        address,
        voteLockerContract.address
      );
      setApproval(approval);
    };
    if (web3Provider && address) {
      loadApproval();
    }
  }, [address, web3Provider]);

  // Load users existing lockup in case this is an extension
  useEffect(() => {
    const loadExistingLockup = async () => {
      const lockup = await voteLockerContract.getLockup(address);
      setExistingAmount(lockup[0]);
      setExistingEnd(lockup[1]);
    };
    if (web3Provider && address) {
      loadExistingLockup();
    }
  }, [address, web3Provider]);

  // Calculate the number of weeks to existing lockup end (if one exists)
  useEffect(() => {
    const lockupEndToWeeks = async (end: ethers.BigNumber) => {
      const now = (await web3Provider.getBlock()).timestamp;
      setExistingEndWeeks(end.sub(now).div(604800).toNumber());
    };
    if (web3Provider && address && existingEnd) {
      lockupEndToWeeks(existingEnd);
    }
  }, [address, existingEnd, web3Provider]);

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
    await governanceTokenContract
      .connect(await web3Provider.getSigner())
      .approve(voteLockerContract.address, ethers.utils.parseUnits(amount));
  };

  const handleLockup = async () => {
    const valid = await validate();
    if (valid) {
      const now = (await web3Provider.getBlock()).timestamp;
      const end = now + weeks * 7 * 86400;
      await voteLockerContract
        .connect(await web3Provider.getSigner())
        .lockup(ethers.utils.parseUnits(amount), end);
    }
  };

  return (
    <>
      <PageTitle>Vote Escrow</PageTitle>

      <div className="grid content-center">
        <div className="stats shadow mb-16">
          <div className="stat">
            <div className="stat-title">Governance Token</div>
            <div className="stat-value text-primary">
              {ethers.utils.formatUnits(balance)}
            </div>
            <div className="stat-desc">OGV</div>
          </div>
          <div className="stat">
            <div className="stat-title">Locked Amount</div>
            <div className="stat-value">
              {ethers.utils.formatUnits(existingAmount)}
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
            onChange={(e) => setAmount(e.target.value)}
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
            onChange={(e) => setWeeks(e.target.value)}
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
            !amount || !weeks || approval.gte(ethers.utils.parseUnits(amount))
          }
          onClick={handleApproval}
        >
          Approve Transfer
        </button>

        <button
          className="btn btn-primary mt-5"
          disabled={
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
