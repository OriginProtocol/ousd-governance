import { contracts } from "constants/index";

export const Reallocation = () => {
  const aaveStrategy = contracts.find(
    (contract: { name: string }) => contract.name === "AaveStrategy"
  );

  const compoundStrategy = contracts.find(
    (contract: { name: string }) => contract.name === "CompoundStrategy"
  );

  const convexStrategy = contracts.find(
    (contract: { name: string }) => contract.name === "ConvexStrategy"
  );

  const assets = {
    DAI: "",
    USDC: "",
    USDT: "",
  };

  const strategies = [aaveStrategy, compoundStrategy, convexStrategy];

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
              {Object.keys(assets).map((asset) => (
                <div>
                  {(Math.random() * 1000).toFixed(5)} {asset}
                </div>
              ))}
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
                  <option>{strategy.name}</option>
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
                  <option>{strategy.name}</option>
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
            {Object.keys(assets).map((asset) => (
              <div className="form-control">
                <label className="label">
                  <span className="label-text">{asset}</span>
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
