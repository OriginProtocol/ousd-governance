import { ethers } from "ethers";

// ABI
import aaveStrat from "@/abi/aave_strat.json";
import buyback from "@/abi/buyback.json";
import compStrat from "@/abi/comp_strat.json";
import convexStrat from "@/abi/convex_strat.json";
import governor from "@/abi/governor.json";
import harvester from "@/abi/harvester.json";
import ogn from "@/abi/ogn.json";
import ousd from "@/abi/ousd.json";
import vaultAdmin from "@/abi/vault_admin.json";
import vaultCore from "@/abi/vault_core.json";

export const provider = new ethers.providers.JsonRpcProvider(
  "https://eth-mainnet.alchemyapi.io/v2/6vvlq0n_hjyPK4myUTJ4PGdD9AXjlPDq"
);
export const governanceAddress = "0x72426BA137DEC62657306b12B1E869d43FeC6eC7";
export const governanceContract = new ethers.Contract(
  governanceAddress,
  governor,
  provider
);

export const addressesContracts = {
  "0x2A8e1E676Ec238d8A992307B495b45B3fEAa5e86": "OUSD",
  "0xE75D77B1865Ae93c7eaa3040B038D7aA7BC02F70": "VaultProxy",
  "0x7294CD3C3eb4097b03E1A61EB2AD280D3dD265e6": "Buyback",
  "0x77314EB392b2be47C014cde0706908b3307Ad6a9": "Buyback",
  "0x8207c1FfC5B6804F6024322CcF34F29c3541Ae26": "OGN",
  "0x9c459eeb3FA179a40329b81C1635525e9A0Ef094": "CompoundStrategyProxy",
  "0x5e3646A1Db86993f73E6b74A57D8640B69F7e259": "AaveStrategyProxy",
};

export const abi = {
  AaveStrategy: aaveStrat,
  Buyback: buyback,
  CompoundStrategy: compStrat,
  ConvexStrategy: convexStrat,
  Governor: governor,
  Harvester: harvester,
  OGN: ogn,
  OUSD: ousd,
  VaultAdmin: vaultAdmin,
  VaultCore: vaultCore,
};
