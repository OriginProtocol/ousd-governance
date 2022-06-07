import Web3 from "web3";
import { ethers } from "ethers";

const ethereumEventsOptions = {
  pollInterval: 10000, // period between polls in milliseconds (default: 13000)
  // Confirmed as soon as we've got it. No real problem with reorgs.
  // Don't use an integer here because it is falsy
  confirmations: "0",
  chunkSize: 1000, // n° of blocks to fetch at a time (default: 10000)
  concurrency: 10, // maximum n° of concurrent web3 requests (default: 10)
  backoff: 1000, // retry backoff in milliseconds (default: 1000)
  // Note: this flag is the reason for the commit specific dependency in package.json
  ignoreUnknownEvents: true,
};

const web3 = new Web3(process.env.PROVIDER_URL);

const provider = new ethers.providers.JsonRpcProvider(process.env.PROVIDER_URL);

export { ethereumEventsOptions, provider, web3 };
