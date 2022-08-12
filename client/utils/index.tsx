import { useEffect, useRef, useState } from "react";
import { ethers, BigNumber } from "ethers";
import { useStore } from "utils/store";
import sanitizeHtml from "sanitize-html";

// Captures 0x + 4 characters, then the last 4 characters.
const truncateRegex = /^(0x[a-zA-Z0-9]{4})[a-zA-Z0-9]+([a-zA-Z0-9]{4})$/;
export const decimal18Bn = BigNumber.from("1000000000000000000");

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

export const truncateBalance = (str) => {
  if (str.includes(".")) {
    const parts = str.split(".");
    return parts[0] + "." + parts[1].slice(0, 4);
  }
  return str;
};

export const loadProposals = async (governanceContract, ids: Array<String>) => {
  const proposalGets = [];
  const proposalStateGets = [];
  for (let id of ids) {
    proposalGets.push(governanceContract.proposals(id));
    proposalStateGets.push(governanceContract.state(id));
  }
  return {
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
  try {
    const typesString = signature.split("(")[1].split(")")[0];
  } catch (e) {
    return [];
  }
  if (typesString.length === 0) return [];
  return typesString.split(",");
};

export const addressContractName = (contracts, address: string): string => {
  return (
    Object.values(contracts).find((c) => c.address === address)?.name ||
    truncateEthAddress(address)
  );
};

export const etherscanLink = (contracts, address: string) => {
  return (
    <a
      className="link link-primary"
      href={`https://etherscan.io/address/${address}`}
      target="_blank"
      rel="noreferrer"
    >
      {addressContractName(contracts, address)}
    </a>
  );
};

export function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

export function useNetworkInfo() {
  const { chainId } = useStore();
  const envNetwork = Number(process.env.NETWORK_ID);
  return {
    walletNetwork: chainId,
    envNetwork: envNetwork,
    correct: envNetwork === chainId,
  };
}

export function inputToBigNumber(
  bigNumber: string,
  decimals: number = 0
): BigNumber {
  const remainingAmount = bigNumber.replace(/[^\d.]/g, "");
  return ethers.utils.parseUnits(
    remainingAmount === "" ? "0" : remainingAmount,
    decimals
  );
}
const fetcher = (url: string) => fetch(url).then((res) => res.json());

export { fetcher };

export function claimOpensTimestamp() {
  return parseInt(useStore.getState().claim.claimOpensTs || "0");
}

export function claimClosesTimestamp() {
  return parseInt(useStore.getState().claim.claimClosesTs || "0");
}

const now = () => Math.floor(new Date().getTime() / 1000);

export function governanceEnabled() {
  return process.env.ENABLE_GOVERNANCE === "true";
}

export function claimOpenTimestampPassed() {
  if (!claimOpensTimestamp()) return true;
  return now() > claimOpensTimestamp();
}

export function claimIsOpen() {
  if (!claimOpensTimestamp() || !claimClosesTimestamp()) return false;
  return now() > claimOpensTimestamp() && now() < claimClosesTimestamp();
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Break up/truncate proposal content for display
const getProposalContent = (proposalDescription: string) => {
  const split = proposalDescription?.split("<br>");
  const title = split && split[0];
  const description = split && split.slice(1).join("<br>").trim();

  const cleanTitle = sanitizeHtml(title);
  const cleanDescription = sanitizeHtml(description, {
    allowedTags: ["br"],
  });

  return { title: cleanTitle, description: cleanDescription };
};

export { getProposalContent };
