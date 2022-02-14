import { ethers } from "ethers";

import Mainnet from "networks/network.mainnet.json";

export const contracts = Object.entries(Mainnet.contracts).map(
  ([name, data]) => ({
    name,
    address: data.address,
    abi: data.abi,
  })
);

const governor = contracts.find(
  (contract: { name: string }) => contract.name === "Governor"
);

export const provider = new ethers.providers.JsonRpcProvider(
  "https://eth-mainnet.alchemyapi.io/v2/6vvlq0n_hjyPK4myUTJ4PGdD9AXjlPDq"
);

export const governorAddress = "0x72426BA137DEC62657306b12B1E869d43FeC6eC7";
export const governanceContract = new ethers.Contract(
  governor.address,
  governor.abi,
  provider
);

export const governanceTokenAddress =
  "0x8207c1ffc5b6804f6024322ccf34f29c3541ae26";
