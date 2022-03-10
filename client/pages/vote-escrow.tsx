import { useEffect, useState } from "react";
import { useStore } from "utils/store";
import { PageTitle } from "components/PageTitle";
import { Disconnected } from "components/Disconnected";
import { governanceTokenContract } from "constants/index";

export default function VoteEscrow({}) {
  const { web3Provider, address } = useStore();
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    const loadBalance = async () => {
      const balance = await governanceTokenContract.balanceOf(address);
      setBalance(balance);
    };
    if (web3Provider && address) {
      loadBalance();
    }
  }, [address]);

  if (!web3Provider) {
    return <Disconnected />;
  }

  return (
    <>
      <PageTitle>Vote Escrow</PageTitle>
      <div className="max-w-lg mx-auto">
        <div className="mb-5">
          Governance token balance: {balance.toString()} OGV
        </div>
        <label className="label">
          <span className="label-text">Lockup amount</span>
        </label>
        <input
          type="number"
          min="0"
          max={balance.toString()}
          placeholder="Amount"
          className="input input-bordered w-full"
        />
        <label className="label">
          <span className="label-text">Lockup length (days)</span>
        </label>
        <div
          type="number"
          min="1"
          max="208"
          placeholder="Type here"
          className="input input-bordered w-full"
        />
        <div className="mt-5">Expected vote power: 0</div>
      </div>
    </>
  );
}
