import { ethers } from "ethers";
import { useEffect, useMemo, useState } from "react";
import { useStore } from "utils/store";

export const Reallocation = () => {
  const { contracts } = useStore();
  const {
    AaveStrategyContract,
    CompoundStrategyContract,
    ConvexStrategyContract,
  } = contracts;
  const [aaveStrategyBalances, setAaveStrategyBalances] = useState([]);
  const [compoundStrategyBalances, setCompoundStrategyBalances] = useState([]);
  const [convexStrategyBalances, setConvexStrategyBalances] = useState([]);

  const strategies = useMemo(() => {
    [
      {
        name: "Aave",
        contract: AaveStrategyContract,
        balances: aaveStrategyBalances,
        balanceGetter: () => aaveStrategyBalances,
        balanceSetter: setAaveStrategyBalances,
      },
      {
        name: "Compound",
        contract: CompoundStrategyContract,
        balanceGetter: () => compoundStrategyBalances,
        balanceSetter: setCompoundStrategyBalances,
      },
      {
        name: "Convex",
        contract: ConvexStrategyContract,
        balanceGetter: () => convexStrategyBalances,
        balanceSetter: setConvexStrategyBalances,
      },
    ];
  }, [
    AaveStrategyContract,
    CompoundStrategyContract,
    ConvexStrategyContract,
    aaveStrategyBalances,
    compoundStrategyBalances,
    convexStrategyBalances,
  ]);

  const assets = useMemo(() => {
    [
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
        symbol: "DAI",
        decimals: 6,
        address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      },
    ];
  }, []);

  useEffect(() => {
    const loadStrategyBalances = async () => {
      for (const strategy of strategies) {
        strategy.balanceSetter(
          await Promise.all(
            Object.values(assets).map((a) =>
              strategy.contract.checkBalance(a.address)
            )
          )
        );
      }
    };
    loadStrategyBalances();
  }, [assets, strategies]);

  const truncateBalance = (str) => {
    if (str.includes(".")) {
      const parts = str.split(".");
      return parts[0] + "." + parts[1].slice(0, 4);
    }
    return str;
  };

  return (
    <>
      <div className="grid grid-cols-3 gap-4">
        {strategies.map((strategy) => (
          <div
            className="card w-96 bg-base-100 shadow-xl mr-6"
            key={strategy.name}
          >
            <div className="card-body">
              <h2 className="card-title">{strategy.name}</h2>
              {assets.map((asset, index) => {
                const balance =
                  strategy.balanceGetter && strategy.balanceGetter()[index];
                if (!balance) return null;
                return (
                  <div key={index}>
                    {asset.symbol}{" "}
                    {truncateBalance(
                      ethers.utils.formatUnits(balance, asset.decimals)
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-12">
        <div className="grid grid-cols-2 gap-12">
          <div className="w-full">
            <div className="form-control">
              <label className="label">
                <span className="label-text">From</span>
              </label>
              <select className="select w-full select-bordered" defaultValue="">
                <option value="" disabled={true}>
                  Strategy to reallocate from
                </option>
                {strategies.map((strategy) => (
                  <option key={strategy.name}>{strategy.name}</option>
                ))}
              </select>
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">To</span>
              </label>
              <select className="select w-full select-bordered" defaultValue="">
                <option value="" disabled={true}>
                  Strategy to reallocate to
                </option>
                {strategies.map((strategy) => (
                  <option key={strategy.name}>{strategy.name}</option>
                ))}
              </select>
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Max Loss</span>
              </label>
              <input type="text" className="input input-bordered" value={100} />
            </div>
          </div>
          <div className="w-full">
            {assets.map((asset) => (
              <div className="form-control" key={asset.symbol}>
                <label className="label">
                  <span className="label-text">{asset.symbol}</span>
                </label>
                <input type="text" className="input input-bordered" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
