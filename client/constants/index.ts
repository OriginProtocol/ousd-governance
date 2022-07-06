import LocalGovernanceContracts from "../networks/governance.localhost.json";
import RinkebyGovernanceContracts from "../networks/governance.rinkeby.json";
import MainnetGovernanceContracts from "../networks/governance.mainnet.json";

export const RPC_URLS = {
  1: process.env.WEB3_PROVIDER,
  4: process.env.WEB3_PROVIDER,
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
    href: "/vote-escrow",
    label: "Vote Escrow",
  },
  {
    href: "/claim",
    label: "Claim",
  },
];
