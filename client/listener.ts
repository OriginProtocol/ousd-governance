import winston from "winston";
import {BigNumber} from "ethers";
import Web3 from "web3";
import schedule from "node-schedule";
import { ethers } from "ethers";
import EthereumEvents from "ethereum-events";
import prisma, { Prisma } from "lib/prisma";
import { CHAIN_CONTRACTS, RPC_URLS } from "constants/index";

const logger = winston.createLogger({
  format: winston.format.simple(),
  transports: [new winston.transports.Console()],
});

const networkId = process.env.NETWORK_ID;
const GovernanceContracts = CHAIN_CONTRACTS[networkId];

if (!networkId) {
  logger.error("No network id specified");
  process.exit(1);
} else {
  logger.info(`Listening on network ${networkId}`);
}

const WEB3_PROVIDER = RPC_URLS[networkId];
const rpc_provider = new ethers.providers.JsonRpcProvider(WEB3_PROVIDER);

export const governanceTokenContract = new ethers.Contract(
  GovernanceContracts.OgvStaking.address,
  ["function balanceOf(address owner) view returns (uint256)"],
  rpc_provider
);

const contracts = [
  {
    name: "Governance",
    address: GovernanceContracts.Governance.address,
    abi: GovernanceContracts.Governance.abi,
    events: ["ProposalCreated"],
  },
  {
    name: "OgvStaking",
    address: GovernanceContracts.OgvStaking.address,
    abi: GovernanceContracts.OgvStaking.abi,
    events: ["Stake", "Unstake"],
  },
];

const options = {
  pollInterval: 10000, // period between polls in milliseconds (default: 13000)
  // Confirmed as soon as we've got it. No real problem with reorgs.
  // Don't use an integer here because it is falsy
  confirmations: "0",
  chunkSize: 1000, // n° of blocks to fetch at a time (default: 10000)
  concurrency: 10, // maximum n° of concurrent web3 requests (default: 10)
  backoff: 1000, // retry backoff in milliseconds (default: 1000)
};

const web3 = new Web3(WEB3_PROVIDER);

const ethereumEvents = new EthereumEvents(web3, contracts, options);

const handleProposalCreated = async (event) => {
  try {
    await prisma.proposal.create({
      data: {
        proposalId: event.values.proposalId,
        description: event.values.description,
      },
    });
    logger.info("Inserted new proposal");
  } catch (e) {
    logger.info(e);
  }
};

const handleStake = async (event) => {
  // Check if lockup exists
  let existingLockup;

  try {
    existingLockup = await prisma.lockup.findUnique({
      where: {
        lockupId_user: {
          user: event.values.user,
          lockupId: parseInt(event.values.lockupId),
        }
      },
      include: {
        transactions: true,
      },
    });
  } catch(e) {
    logger.info(e);
  }

  // If it does (extend action), update it (new end, new points and additional tx hash)
  if(existingLockup) {
    try {
      await prisma.lockup.update({
        where: {
          lockupId_user: {
            user: event.values.user,
            lockupId: parseInt(event.values.lockupId),
          }
        },
        data: {
          end: new Date(event.values.end * 1000),
          points: event.values.points,
          transactions: {
            create: [{
              hash: event.transactionHash,
              event: "Extend",
              createdAt: new Date(event.timestamp * 1000),
            }],
          },
          active: true,
        },
      });
      logger.info(`Updated lockup ${parseInt(event.values.lockupId)} for ${event.values.user}`);
    } catch (e) {
      logger.info(e);
    }
  } else {
    // If it doesn't, create it (stake action)
    try {
      await prisma.lockup.create({
        data: {
          user: event.values.user,
          lockupId: parseInt(event.values.lockupId),
          amount: event.values.amount,
          end: new Date(event.values.end * 1000),
          points: event.values.points,
          transactions: {
            create: [{
              hash: event.transactionHash,
              event: event.name,
              createdAt: new Date(event.timestamp * 1000),
            }],
          },
          active: true,
        },
      });
      logger.info(`Inserted lockup ${parseInt(event.values.lockupId)} for ${event.values.user}`);
    } catch (e) {
      logger.info(e);
    }
  }
}

const handleUnstake = async (event) => {
  // Check if lockup exists
  let existingLockup;

  try {
    existingLockup = await prisma.lockup.findUnique({
      where: {
        lockupId_user: {
          user: event.values.user,
          lockupId: parseInt(event.values.lockupId),
        }
      },
    });
  } catch(e) {
    logger.info(e);
  }

  if(existingLockup) {
  // Flag lockup as inactive
    try {
      await prisma.lockup.update({
        where: {
          lockupId_user: {
            user: event.values.user,
            lockupId: parseInt(event.values.lockupId),
          }
        },
        data: {
          active: false,
        }
      });
      logger.info(`Lockup ${parseInt(event.values.lockupId)} for ${event.values.user} deactivated`);
    } catch (e) {
      logger.info(e);
    }
  }
}

const handleNewVoter = async (event) => {
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
    logger.info(e);
  }
}

const handleEvents = async (blockNumber, events, done) => {
  for (const event of events) {
    switch(event.name) {
      case 'ProposalCreated':
        await handleProposalCreated(event);
        break;
      case 'Stake':
        await handleStake(event);
        break;
      case 'Unstake':
        await handleUnstake(event);
        break;
      default:
        await handleNewVoter(event);
    }
  }
};

ethereumEvents.on("block.confirmed", async (blockNumber, events, done) => {
  logger.info(`Got confirmed block ${blockNumber}`);
  await handleEvents(blockNumber, events, done);
  const existingLastBlock = await prisma.listener.findFirst();
  if (existingLastBlock) {
    await prisma.listener.update({
      where: { lastSeenBlock: existingLastBlock.lastSeenBlock },
      data: {
        lastSeenBlock: blockNumber,
      },
    });
  } else {
    await prisma.listener.create({
      data: {
        lastSeenBlock: blockNumber,
      },
    });
  }

  done();
});

ethereumEvents.on("error", (err) => {
  logger.error(err);
});

// TODO start this at contract deployment or last checked
prisma.listener.findFirst().then(async (listener) => {
  let listenBlock:number = 0;
  if (listener) {
    if (process.env.NODE_ENV === 'development') {
      const blockNumber:number = await rpc_provider.getBlockNumber();
      /* in dev check the chain's blockNumber. If differs too much from stored listener 
       * amount skip to the current block. The reason is that probably hardhat forked mode
       * was set to a different blockNumber and it might take too long for the listener to 
       * catch up
       */
      listenBlock = Math.abs(listener.lastSeenBlock - blockNumber) > 200 ? blockNumber : listener.lastSeenBlock;
    } else {
      // in production continue where left off last time
      listenBlock = listener.lastSeenBlock
    }
  }
  ethereumEvents.start(listenBlock);
});

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
