import fs from "fs";
import { BigNumber } from "ethers";
import EthereumEvents from "ethereum-events";
import {
  BlockHistory,
  bigNumberify,
  rewardScore,
  handleERC20Transfer,
} from "./utils";
import {
  ousdContract,
  wousdContract,
  OUSD_DEPLOY_BLOCK,
  WOUSD_DEPLOY_BLOCK,
} from "./contracts";
import { ethereumEventsOptions, web3 } from "./config";

const AIRDROP_AMOUNT = 400000000;
const SNAPSHOT_BLOCK = 14888133;
const PROGRESS_FILE = "ousd-progress.json";

type ProgressFile = {
  blockNumber: number;
  ousdHolders: { [address: string]: BlockHistory[] };
  wousdHolders: { [address: string]: BlockHistory[] };
};

let savedProgress: ProgressFile;
try {
  savedProgress = JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf8"));
  console.log(
    `Using progress file to resume from ${savedProgress.blockNumber}`
  );
} catch (error) {
  console.log("No progress file, starting from first deployment");
  savedProgress = {
    blockNumber: Math.min(OUSD_DEPLOY_BLOCK, WOUSD_DEPLOY_BLOCK),
    ousdHolders: {},
    wousdHolders: {},
  };
}

let { ousdHolders, wousdHolders } = savedProgress;

const contracts = [ousdContract, wousdContract];

const ethereumEvents = new EthereumEvents(
  web3,
  contracts,
  ethereumEventsOptions
);

const handleOusdTransfer = async (blockNumber: number, event) => {
  ousdHolders = handleERC20Transfer(
    ousdHolders,
    blockNumber,
    event.values.from,
    event.values.to,
    event.values.value
  );
};

const handleWousdTransfer = async (blockNumber: number, event) => {
  wousdHolders = handleERC20Transfer(
    wousdHolders,
    blockNumber,
    event.values.from,
    event.values.to,
    event.values.value
  );
};

ethereumEvents.on("block.confirmed", async (blockNumber, events, done) => {
  for (const event of events) {
    if (event.to === ousdContract.address) {
      handleOusdTransfer(blockNumber, event);
    } else if (event.to === wousdContract.address) {
      handleWousdTransfer(blockNumber, event);
    }
  }

  if (blockNumber) {
    process.stdout.write(
      `${blockNumber} - ${Object.keys(ousdHolders).length} OUSD holders, ${Object.keys(wousdHolders).length
      } wOUSD holders\r`
    );
  }

  // Save the progress every 50000 blocks
  if (blockNumber % 10000 === 0) {
    savedProgress = {
      blockNumber,
      ousdHolders,
      wousdHolders,
    };
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(savedProgress));
  }

  if (blockNumber === SNAPSHOT_BLOCK) {
    ethereumEvents.stop();
    const claims = calculateRewards();

    const csv = Object.entries(claims).map(
      ([address, data]: [address: string, data: any]) => {
        return `${address},${["ousd", "wousd"]
          .map((key) =>
            data.split[key] === undefined ? 0 : data.split[key].toString()
          )
          .join(",")},${data.amount}`;
      }
    );

    // Write a CSV for for easier verification
    fs.writeFileSync("ousd-rewards.csv", csv.join("\n"));
    // Write merkle tree claims JSON structure
    fs.writeFileSync("ousd-claims.json", JSON.stringify(claims));
  }

  done();
});

const calculateRewards = () => {
  console.log("\n");
  console.log("Calculating OUSD rewards");
  const ousdRewards = rewardScore(ousdHolders, SNAPSHOT_BLOCK);
  console.log("Calculating wOUSD rewards");
  const wousdRewards = rewardScore(wousdHolders, SNAPSHOT_BLOCK);

  const totalScore = Object.values(ousdRewards)
    .concat(Object.values(wousdRewards))
    .reduce((total: BigNumber, a: { [desc: string]: BigNumber }) => {
      return total.add(bigNumberify(Object.values(a)[0]));
    }, bigNumberify(0));

  const addresses = [
    ...new Set(Object.keys(ousdRewards).concat(Object.keys(wousdRewards))),
  ];

  return addresses.reduce((acc, address) => {
    const ousdReward = ousdRewards[address]
      ? ousdRewards[address].mul(AIRDROP_AMOUNT).div(totalScore)
      : bigNumberify(0);

    const wousdReward = wousdRewards[address]
      ? wousdRewards[address].mul(AIRDROP_AMOUNT).div(totalScore)
      : bigNumberify(0);
    acc[address] = {
      amount: ousdReward.add(wousdReward),
      split: {
        ousd: ousdReward,
        wousd: wousdReward,
      },
    };
    return acc;
  }, {});
};

console.log("Searching for events...");

ethereumEvents.start(savedProgress.blockNumber);
