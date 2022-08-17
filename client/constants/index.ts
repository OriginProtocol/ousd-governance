import LocalGovernanceContracts from "../networks/governance.localhost.json";
import RinkebyGovernanceContracts from "../networks/governance.rinkeby.json";
import MainnetGovernanceContracts from "../networks/governance.mainnet.json";
import { governanceEnabled } from "utils";

export const mainnetNetworkUrl = process.env.WEB3_PROVIDER;
export const rinkebyNetworkUrl = process.env.WEB3_PROVIDER;

export const websocketProvider = process.env.WEB3_PROVIDER?.replace(
  "http",
  "ws"
);

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

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

let navItems = [
  /*
  {
    href: "/leaderboard",
    label: "Leaderboard",
  },*/
  {
    href: "/claim",
    label: "Claim",
  },
  {
    href: "/stake",
    label: "Stake",
  },
  {
    href: "https://app.uniswap.org/#/swap?outputCurrency=0x9c354503C38481a7A7a51629142963F98eCC12D0&chain=mainnet",
    label: "Buy OGV",
    external: true,
  },
  {
    href: "https://ousd.com/swap",
    label: "Get OUSD",
    external: true,
  },
];

if (governanceEnabled()) {
  navItems = [
    {
      href: "/",
      label: "Overview",
    },
    {
      href: "/proposal",
      label: "Proposal",
    },
    ...navItems,
  ];
}

export { navItems };

// daysPerAverageYear * hoursPerDay * minutesPerHour * secondsPerMinute / monthsPerYear = secondsPerMonth
export const SECONDS_IN_A_MONTH = 2629800; // 365.25 * (24 * 60 * 60) / 12
