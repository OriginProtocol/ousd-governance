import { ethers, BigNumber } from "ethers";
import { useEffect, useMemo, useState, FunctionComponent } from "react";
import { useStore } from "utils/store";
import { truncateBalance, inputToBigNumber } from "utils/index";
import { toast } from "react-toastify";
import useShowDelegationModalOption from "utils/useShowDelegationModalOption";
import { EnsureDelegationModal } from "components/proposal/EnsureDelegationModal";
import { useRouter } from "next/router";

interface ReallocationProps {
  proposalDetails: string;
}

const Reallocation: FunctionComponent<ReallocationProps> = ({
  proposalDetails,
}) => {
  const router = useRouter();
  const { contracts, pendingTransactions } = useStore();
  const { showModalIfApplicable } = useShowDelegationModalOption();
  const [fromStrategy, setFromStrategy] = useState<string>("");
  const [toStrategy, setToStrategy] = useState<string>("");
  const [daiAmount, setDaiAmount] = useState(BigNumber.from(0));
  const [usdcAmount, setUsdcAmount] = useState(BigNumber.from(0));
  const [usdtAmount, setUsdtAmount] = useState(BigNumber.from(0));
  const [maxLoss, setMaxLoss] = useState(ethers.utils.parseUnits("100", 18));
  const amounts = [daiAmount, usdcAmount, usdtAmount];

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

  const {
    ProxiedAaveStrategy,
    ProxiedCompoundStrategy,
    ProxiedConvexStrategy,
    proxiedContracts,
    strategies,
  } = useMemo(() => {
    if (!contracts.loaded) {
      return {};
    }

    const ProxiedAaveStrategy = new ethers.Contract(
      contracts.AaveStrategyProxy.address,
      contracts.AaveStrategy.interface.fragments,
      contracts.AaveStrategy.provider
    );
    const ProxiedCompoundStrategy = new ethers.Contract(
      contracts.CompoundStrategyProxy.address,
      contracts.CompoundStrategy.interface.fragments,
      contracts.CompoundStrategy.provider
    );
    const ProxiedConvexStrategy = new ethers.Contract(
      contracts.ConvexStrategyProxy.address,
      contracts.ConvexStrategy.interface.fragments,
      contracts.ConvexStrategy.provider
    );

    const proxiedContracts = [
      ProxiedAaveStrategy,
      ProxiedCompoundStrategy,
      ProxiedConvexStrategy,
    ];

    return {
      ProxiedAaveStrategy,
      ProxiedCompoundStrategy,
      ProxiedConvexStrategy,
      proxiedContracts,
      strategies: [
        { name: "Aave", address: contracts.AaveStrategyProxy.address },
        { name: "Compound", address: contracts.CompoundStrategyProxy.address },
        { name: "Convex", address: contracts.ConvexStrategyProxy.address },
      ],
    };
  }, [contracts]);

  const { proposalActions, proposal, handleSubmit } = useMemo(() => {
    let proposalActions = [];

    if (toStrategy !== "" && fromStrategy !== "") {
      proposalActions = proposalActions.concat([
        {
          target: contracts.VaultValueChecker.address.toLowerCase(),
          value: BigNumber.from("0"),
          signature: "takeSnapshot()",
          calldata: "0x",
        },
      ]);

      proposalActions = proposalActions.concat(
        assets
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
                target: fromStrategy.toLowerCase(),
                value: BigNumber.from("0"),
                signature: "withdraw(address,address,uint256)",
                calldata: fromContract.interface.encodeFunctionData(
                  fromContract.interface.functions[
                    "withdraw(address,address,uint256)"
                  ],
                  [toStrategy, asset.address, amount]
                ),
              };
            }
          })
          .filter((a) => a !== undefined)
      );

      proposalActions = proposalActions.concat([
        {
          target: contracts.VaultValueChecker.address.toLowerCase(),
          value: BigNumber.from("0"),
          signature: "checkLoss(int256)",
          calldata: contracts.VaultValueChecker.interface.encodeFunctionData(
            contracts.VaultValueChecker.interface.functions[
              "checkLoss(int256)"
            ],
            [maxLoss]
          ),
        },
      ]);
    }

    const proposal = {
      targets: proposalActions.map((p) => p.target),
      values: proposalActions.map((p) => p.value),
      signatures: proposalActions.map((p) => p.signature),
      calldatas: proposalActions.map((p) => p.calldata),
    };

    const handleSubmit = async () => {
      // showing delegation modal quits flow
      if (showModalIfApplicable()) {
        return;
      }

      const transaction = await contracts.Governance[
        "propose(address[],uint256[],string[],bytes[],string)"
      ](
        proposal.targets,
        proposal.values,
        proposal.signatures,
        proposal.calldatas,
        proposalDetails.replace(/\n/g, "<br>\n")
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
              router.push(`/proposals`);
              reset();
            },
          },
        ],
      });
    };

    return {
      proposalActions,
      proposal,
      handleSubmit,
    };
  }, [contracts, toStrategy, fromStrategy, amounts, maxLoss]);

  const reset = () => {
    setFromStrategy("");
    setToStrategy("");
    setDaiAmount(BigNumber.from(0));
    setUsdcAmount(BigNumber.from(0));
    setUsdtAmount(BigNumber.from(0));
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="table w-full">
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
                {strategies &&
                  strategies.map((strategy) => (
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
                {strategies &&
                  strategies.map((strategy) => (
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
                value={truncateBalance(ethers.utils.formatUnits(maxLoss, 18))}
                onChange={(e) => {
                  setMaxLoss(inputToBigNumber(e.target.value, 18));
                }}
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
                      setDaiAmount(inputToBigNumber(e.target.value, 18));
                    } else if (asset.symbol === "USDC") {
                      setUsdcAmount(inputToBigNumber(e.target.value, 6));
                    } else if (asset.symbol === "USDT") {
                      setUsdtAmount(inputToBigNumber(e.target.value, 6));
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
      <EnsureDelegationModal />
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

export { Reallocation };
