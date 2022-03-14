import { ethers } from "ethers";
import { useEffect, useState } from "react";
import { useStore } from "utils/store";
import { PageTitle } from "components/PageTitle";
import { Disconnected } from "components/Disconnected";
import { governanceTokenContract, voteLockerContract } from "constants/index";

const MAX_WEEKS = 52 * 4;

export default function VoteEscrow({}) {
  const { provider, web3Provider, address } = useStore();
  const [amount, setAmount] = useState(0);
  const [weeks, setWeeks] = useState(0);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    const loadBalance = async () => {
      const balance = await governanceTokenContract.balanceOf(address);
      setBalance(balance);
    };
    if (web3Provider && address) {
      loadBalance();
    }
  }, [address, web3Provider]);

  if (!web3Provider) {
    return <Disconnected />;
  }

  let estimatedVotePower;
  if (amount && weeks) {
    estimatedVotePower = ethers.utils.formatUnits(
      ethers.utils.parseUnits(amount).mul(weeks).div(MAX_WEEKS)
    );
  }

  const handleLockup = async () => {
    const now = (await web3Provider.getBlock()).timestamp;
    const tx = await voteLockerContract
      .connect(await web3Provider.getSigner())
      .upsertLockup(ethers.utils.parseUnits(amount), now + weeks * 7 * 86400);
  };

  return (
    <>
      <PageTitle>Vote Escrow</PageTitle>
      <div className="max-w-lg mx-auto">
        <div className="mb-5">
          Governance token balance: {ethers.utils.formatUnits(balance)} OGV
        </div>
        <label className="label">
          <span className="label-text">Lockup amount</span>
        </label>
        <div className="input-group">
          <input
            type="number"
            min="0"
            max={balance.toString()}
            placeholder="Amount"
            className="input input-bordered w-full"
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
        <label className="label">
          <span className="label-text">Lockup length (weeks)</span>
        </label>
        <div className="input-group">
          <input
            type="number"
            min="1"
            max={MAX_WEEKS.toString()}
            placeholder="Type here"
            className="input input-bordered w-full"
            value={weeks}
            onChange={(e) => setWeeks(e.target.value)}
          />
          <button className="btn" onClick={() => setWeeks(MAX_WEEKS)}>
            Max
          </button>
        </div>
        {estimatedVotePower && (
          <div className="mt-5">Estimated votes: {estimatedVotePower}</div>
        )}

        <button className="btn btn-primary mt-5" disabled={!amount || !weeks}>
          <span className="btn-text" onClick={handleLockup}>
            Lockup
          </span>
        </button>
      </div>
    </>
  );
}
