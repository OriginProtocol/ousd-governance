import winston from "winston";
import Web3 from "web3";
import schedule from "node-schedule";
import { ethers } from "ethers";
import EthereumEvents from "ethereum-events";
import prisma, { Prisma } from "ousd-governance-client/lib/prisma";
import {
  CHAIN_CONTRACTS,
  RPC_URLS,
} from "ousd-governance-client/constants/index";

const networkId = process.env.NETWORK_ID || 31337;
const GovernanceContracts = CHAIN_CONTRACTS[networkId];

const logger = winston.createLogger({
  format: winston.format.simple(),
  transports: [new winston.transports.Console()],
});

const WEB3_PROVIDER = RPC_URLS[networkId];

export const governanceTokenContract = new ethers.Contract(
  GovernanceContracts.VoteLockerCurve.address,
  ["function balanceOf(address owner) view returns (uint256)"],
  new ethers.providers.JsonRpcProvider(WEB3_PROVIDER)
);

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
    events: ["LockupCreated"],
  },
];

const options = {
  pollInterval: 10000, // period between polls in milliseconds (default: 13000)
  // Confirmed as soon as we've got it. No real problem with reorgs.
  confirmations: 0,
  chunkSize: 10000, // n° of blocks to fetch at a time (default: 10000)
  concurrency: 10, // maximum n° of concurrent web3 requests (default: 10)
  backoff: 1000, // retry backoff in milliseconds (default: 1000)
};

const web3 = new Web3(WEB3_PROVIDER);

const ethereumEvents = new EthereumEvents(web3, contracts, options);

const handleEvents = async (blockNumber, events, done) => {
  for (const event of events) {
    if (event.name == "ProposalCreated") {
      try {
        await prisma.proposal.create({
          data: {
            proposalId: event.values.proposalId,
          },
        });
        logger.info("Inserted new proposal");
      } catch (e) {
        logger.warn("Probable duplicate proposal");
      }
    } else {
      try {
        await prisma.voter.create({
          data: {
            address: event.values.provider,
            votes: (
              await governanceTokenContract.balanceOf(event.values.provider)
            ).toString(),
            firstSeenBlock: event.blockNumber,
          },
        });
        logger.info("Inserted new voter");
      } catch (e) {
        logger.warn("Probable duplicate voter");
      }
    }
  }
};

ethereumEvents.on("block.confirmed", async (blockNumber, events, done) => {
  handleEvents(blockNumber, events, done);
  done();
});

ethereumEvents.on("error", (err) => {
  logger.error(err);
});

// TODO start this at contract deployment or last checked
ethereumEvents.start(1);

logger.info("Listening for Ethereum events");

// Job to update votes in the voters table
const rule = new schedule.RecurrenceRule();
rule.hour = 0;

schedule.scheduleJob(rule, async function () {
  logger.info("Updating vote power");
  const voter = await prisma.voter.findMany();
  for (const v of voter) {
    const votes = await governanceTokenContract.balanceOf(v.address);
    if (votes.toString() != v.votes.toString()) {
      await prisma.voter.update({
        data: {
          votes: votes.toString(),
        },
        where: { id: v.id },
      });
    }
  }
  logger.info("Vote power updated");
});

process.on("SIGINT", function () {
  schedule.gracefulShutdown().then(() => process.exit(0));
});
