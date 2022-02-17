import { ethers } from "ethers";
import { contracts } from "constants/index";
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

export const decodeCalldata = (signature: string, calldata: string) => {
  const types = typesFromSignature(signature);
  return ethers.utils.defaultAbiCoder.decode(types, calldata);
};

export const encodeCalldata = (
  signature: string,
  values: any[] = []
): string => {
  const types = typesFromSignature(signature);
  return ethers.utils.defaultAbiCoder.encode(types, values);
};

export const functionNameFromSignature = (signature: string): string => {
  return signature.substring(0, signature.indexOf("("));
};

export const argumentsFromSignature = (signature: string): string[] => {
  return signature
    .substring(signature.indexOf("(") + 1, signature.indexOf(")"))
    .split(",");
};

export const typesFromSignature = (signature: string): string[] => {
  const typesString = signature.split("(")[1].split(")")[0];
  if (typesString.length === 0) return [];
  return typesString.split(",");
};

export const addressContractName = (address: string): string => {
  return (
    contracts.find((c) => c.address === address)?.name ||
    truncateEthAddress(address)
  );
};

export const etherscanLink = (address: string) => {
  return (
    <a
      className="link link-primary"
      href={`https://etherscan.io/address/${address}`}
      target="_blank"
      rel="noreferrer"
    >
      {addressContractName(address)}
    </a>
  );
};
