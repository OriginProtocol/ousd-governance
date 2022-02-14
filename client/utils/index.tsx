import { governanceContract } from "constants/index";

// Captures 0x + 4 characters, then the last 4 characters.
const truncateRegex = /^(0x[a-zA-Z0-9]{4})[a-zA-Z0-9]+([a-zA-Z0-9]{4})$/;

/**
 * Truncates an ethereum address to the format 0x0000…0000
 * @param address Full address to truncate
 * @returns Truncated address
 */
export const truncateEthAddress = (address: string) => {
  const match = address.match(truncateRegex);
  if (!match) return address;
  return `${match[1]}…${match[2]}`;
};

export const loadProposals = async () => {
  const count = await governanceContract.proposalCount();
  const proposalGets = [];
  const proposalStateGets = [];
  for (let i = 1; i <= count; i++) {
    proposalGets.push(governanceContract.proposals(i));
    proposalStateGets.push(governanceContract.state(i));
  }
  return {
    count,
    proposals: await Promise.all(proposalGets),
    states: await Promise.all(proposalStateGets),
  };
};
