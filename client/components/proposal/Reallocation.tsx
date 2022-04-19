import { ethers } from "ethers";
import { useEffect, useMemo, useState } from "react";
import { useStore } from "utils/store";
import { truncateBalance } from "utils/index";
import { toast } from "react-toastify";

export const Reallocation = ({ snapshotHash }) => {
  const { contracts, pendingTransactions } = useStore();
  const { Governance } = contracts;

  const [fromStrategy, setFromStrategy] = useState<string>("");
  const [toStrategy, setToStrategy] = useState<string>("");
  const [daiAmount, setDaiAmount] = useState(ethers.BigNumber.from(0));
  const [usdcAmount, setUsdcAmount] = useState(ethers.BigNumber.from(0));
  const [usdtAmount, setUsdtAmount] = useState(ethers.BigNumber.from(0));
  const [maxLoss, setMaxLoss] = useState(ethers.BigNumber.from(0));

  const ProxiedAaveStrategy = new ethers.Contract(
    contracts.AaveStrategyProxy.address,
    contracts.AaveStrategy.abi,
    contracts.AaveStrategy.provider
  );

  const ProxiedCompoundStrategy = new ethers.Contract(
    contracts.CompoundStrategyProxy.address,
    contracts.CompoundStrategy.abi,
    contracts.CompoundStrategy.provider
  );

  const ProxiedConvexStrategy = new ethers.Contract(
    contracts.ConvexStrategyProxy.address,
    contracts.ConvexStrategy.abi,
    contracts.ConvexStrategy.provider
  );

  const proxiedContracts = [
    ProxiedAaveStrategy,
    ProxiedCompoundStrategy,
    ProxiedConvexStrategy,
  ];

  const amounts = [daiAmount, usdcAmount, usdtAmount];

  const strategies = [
    { name: "Aave", address: contracts.AaveStrategyProxy.address },
    { name: "Compound", address: contracts.CompoundStrategyProxy.address },
    { name: "Convex", address: contracts.ConvexStrategyProxy.address },
  ];

  const assets = useMemo(
    () => [
      {
        symbol: "DAI",
        decimals: 18,
        address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
      },
      {
        symbol: "USDC",
        decimals: 6,
        address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      },
      {
        symbol: "USDT",
        decimals: 6,
        address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      },
    ],
    []
  );

  const reset = () => {
    setFromStrategy("");
    setToStrategy("");
    setDaiAmount(ethers.BigNumber.from(0));
    setUsdcAmount(ethers.BigNumber.from(0));
    setUsdtAmount(ethers.BigNumber.from(0));
  };

  const proposalActions = assets
    .map((asset, i) => {
      if (toStrategy === "" || fromStrategy === "") {
        return;
      }
      const amount = amounts[i];
      if (amount.gt(0)) {
        const fromContract = proxiedContracts.find(
          (c) => c.address === fromStrategy
        );
        if (fromContract === undefined) return;
        return {
          targets: [fromStrategy],
          values: [0],
          signatures: ["withdraw(address,address,uint256)"],
          calldatas: [
            fromContract.interface.encodeFunctionData(
              fromContract.interface.functions[
                "withdraw(address,address,uint256)"
              ],
              [toStrategy, asset.address, amount]
            ),
          ],
        };
      }
    })
    .filter((a) => a !== undefined);

  const proposal = {
    targets: proposalActions.map((p) => p.targets),
    values: proposalActions.map((p) => p.values),
    signatures: proposalActions.map((p) => p.signatures),
    calldatas: proposalActions.map((p) => p.calldatas),
  };

  const handleSubmit = async () => {
    const transaction = await Governance[
      "propose(address[],uint256[],string[],bytes[],string)"
    ](
      proposal.targets,
      proposal.values,
      proposal.signatures,
      proposal.calldatas,
      snapshotHash
    );

    useStore.setState({
      pendingTransactions: [
        ...pendingTransactions,
        {
          ...transaction,
          onComplete: () => {
            toast.success("Proposal has been submitted", {
              hideProgressBar: true,
            });
            reset();
          },
        },
      ],
    });
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              <th>&nbsp;</th>
              <th>Aave</th>
              <th>Compound</th>
              <th>Convex</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset, i) => (
              <StrategyBalanceRow
                key={i}
                asset={asset}
                proxiedContracts={proxiedContracts}
              />
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-12">
        <div className="grid grid-cols-2 gap-12">
          <div className="w-full">
            <div className="form-control">
              <label className="label">
                <span className="label-text">From</span>
              </label>
              <select
                className="select w-full select-bordered"
                defaultValue=""
                onChange={(e) => setFromStrategy(e.target.value)}
              >
                <option value="" disabled={true}>
                  Strategy to reallocate from
                </option>
                {strategies.map((strategy) => (
                  <option key={strategy.name} value={strategy.address}>
                    {strategy.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">To</span>
              </label>
              <select
                className="select w-full select-bordered"
                defaultValue=""
                onChange={(e) => setToStrategy(e.target.value)}
              >
                <option value="" disabled={true}>
                  Strategy to reallocate to
                </option>
                {strategies.map((strategy) => (
                  <option key={strategy.name} value={strategy.address}>
                    {strategy.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Max Loss</span>
              </label>
              <input
                type="text"
                className="input input-bordered"
                value={100}
                onChange={(e) => setMaxLoss(e.target.value)}
              />
            </div>
          </div>
          <div className="w-full">
            {assets.map((asset) => (
              <div className="form-control" key={asset.symbol}>
                <label className="label">
                  <span className="label-text">{asset.symbol}</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  onChange={(e) => {
                    if (asset.symbol === "DAI") {
                      setDaiAmount(
                        ethers.utils.parseUnits(e.target.value || "0", 18)
                      );
                    } else if (asset.symbol === "USDC") {
                      setUsdcAmount(
                        ethers.utils.parseUnits(e.target.value || "0", 6)
                      );
                    } else if (asset.symbol === "USDT") {
                      setUsdtAmount(
                        ethers.utils.parseUnits(e.target.value || "0", 6)
                      );
                    }
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex">
        <button
          className="btn btn-primary mt-24"
          onClick={handleSubmit}
          disabled={proposalActions.length === 0}
        >
          Submit Proposal
        </button>
      </div>
    </>
  );
};

const StrategyBalanceRow = ({
  asset,
  proxiedContracts,
}: {
  asset: Object<any>;
  proxiedContracts: Array<any>;
}) => {
  const [balances, setBalances] = useState([]);

  useEffect(() => {
    const loadBalances = async () => {
      setBalances(
        await Promise.all(
          proxiedContracts.map((contract) =>
            contract.checkBalance(asset.address)
          )
        )
      );
    };
    loadBalances();
  }, [asset, proxiedContracts]);

  const { symbol, decimals } = asset;

  return (
    <tr>
      <td className="text-gray-400">{symbol}</td>
      {balances.map((balance, i) => (
        <td key={i}>
          {truncateBalance(ethers.utils.formatUnits(balance, decimals))}
        </td>
      ))}
    </tr>
  );
};
