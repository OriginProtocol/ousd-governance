import { ethers } from "ethers";

// Note we don't have a Rinkeby deploy of OUSD contracts, so always use mainnet
import OUSDContracts from "networks/network.mainnet.json";
// Note this will crash if user does not have a local deploy
import GovernanceContracts from "networks/governance.localhost.json";

export const contracts = Object.entries(OUSDContracts.contracts).map(
  ([name, data]) => ({
    name,
    address: data.address,
    abi: data.abi,
  })
);

const governor = GovernanceContracts.Governance;

export const provider = new ethers.providers.JsonRpcProvider(
  process.env.WEB3_PROVIDER
);

export const governanceContract = new ethers.Contract(
  governor.address,
  governor.abi,
  provider
);

export const governanceTokenAddress =
  GovernanceContracts.GovernanceToken.address;

export const governanceTokenContract = new ethers.Contract(
  governanceTokenAddress,
  [
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",
  ],
  provider
);

export const VoteLocker = GovernanceContracts.VoteLockerCurve.address;
