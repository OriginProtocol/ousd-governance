import LocalGovernanceContracts from "../networks/governance.localhost.json";
import RinkebyGovernanceContracts from "../networks/governance.rinkeby.json";
import MainnetGovernanceContracts from "../networks/governance.mainnet.json";

export const mainnetNetworkUrl = process.env.WEB3_PROVIDER;
export const rinkebyNetworkUrl = process.env.WEB3_PROVIDER;

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
  /*{
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
  },*/
  {
    href: "/stake",
    label: "Stake",
  },
  {
    href: "/claim",
    label: "Claim",
  },
];

export const SECONDS_IN_A_MONTH = 2592000;
