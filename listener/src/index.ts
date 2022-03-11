import Web3 from "web3";
import EthereumEvents from "ethereum-events";
import prisma from "ousd-governance-client/lib/prisma";
import GovernanceContracts from "ousd-governance-client/networks/governance.localhost.json";

const WEB3_PROVIDER = process.env.WEB3_PROVIDER || "http://localhost:8545";

const contracts = [
  {
    name: "Governance",
    address: GovernanceContracts.Governance.address,
    abi: GovernanceContracts.Governance.abi,
    events: ["ProposalCreated"],
  },
  {
    name: "VoteLockerCurve",
    address: GovernanceContracts.VoteLockerCurve.address,
    abi: GovernanceContracts.VoteLockerCurve.abi,
    events: ["Lockup"],
  },
];

const options = {
  pollInterval: 13000, // period between polls in milliseconds (default: 13000)
  confirmations: 12, // n° of confirmation blocks (default: 12)
  chunkSize: 10000, // n° of blocks to fetch at a time (default: 10000)
  concurrency: 10, // maximum n° of concurrent web3 requests (default: 10)
  backoff: 1000, // retry backoff in milliseconds (default: 1000)
};

const web3 = new Web3(WEB3_PROVIDER);

const ethereumEvents = new EthereumEvents(web3, contracts, options);

ethereumEvents.on("block.confirmed", (blockNumber, events, done) => {
  console.log("Got a block");
  console.log(events);
  done();
});

ethereumEvents.on("block.unconfirmed", (blockNumber, events, done) => {
  console.log("Unconfirmed block");
  done();
});

ethereumEvents.on("error", (err) => {
  console.log(err);
});

ethereumEvents.start(0);

console.log("Listener started");
