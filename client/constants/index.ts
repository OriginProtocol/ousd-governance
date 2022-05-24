import LocalGovernanceContracts from "../networks/governance.localhost.json";
import RinkebyGovernanceContracts from "../networks/governance.rinkeby.json";
import MainnetGovernanceContracts from "../networks/governance.mainnet.json";

export const INFURA_ID = "460f40a260564ac4a4f4b3fffb032dad";
export const mainnetNetworkUrl = `https://mainnet.infura.io/v3/${INFURA_ID}`;
export const rinkebyNetworkUrl =
  "https://eth-rinkeby.alchemyapi.io/v2/i4XEfcs5ZohhedGPYPK72GBrz6mBpjAP";

export const RPC_URLS = {
  1: mainnetNetworkUrl,
  4: rinkebyNetworkUrl,
  31337: "http://localhost:8545",
};

export const CHAIN_CONTRACTS = {
  1: MainnetGovernanceContracts,
  4: RinkebyGovernanceContracts,
  31337: LocalGovernanceContracts,
};

export const navItems = [
  {
    href: "/",
    label: "Overview",
  },
  {
    href: "/proposal",
    label: "Proposal",
  },
  {
    href: "/leaderboard",
    label: "Leaderboard",
  },
  {
    href: "/vote-escrow",
    label: "Vote Escrow",
  },
];

export const APP_NAME = "OUSD Governance";
