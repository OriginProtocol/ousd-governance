import fs from "fs";
import { BigNumber } from "ethers";
import EthereumEvents from "ethereum-events";
import {
  BlockHistory,
  bigNumberify,
  cumulativeRewardScore,
  handleERC20Transfer,
} from "./utils";
import {
  ousdContract,
  wousdContract,
  OUSD_DEPLOY_BLOCK,
  WOUSD_DEPLOY_BLOCK,
} from "./contracts";
import { ethereumEventsOptions, web3 } from "./config";

const AIRDROP_AMOUNT = bigNumberify("400000000000000000000000000");
// https://etherscan.io/block/15087759
const SNAPSHOT_BLOCK = 15087759;
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

const excludedContracts = [
  "0x87650D7bbfC3A9F10587d7778206671719d9910D", // Curve.fi
  "0xCC01d9D54d06b6a0b6D09A9f79c3A6438e505f71", // Uni v2
  "0xcecaD69d7D4Ed6D52eFcFA028aF8732F27e08F70", // Flipper
  "0x129360c964e2E13910d603043F6287E5e9383374", // Uni v3
];

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
      `${blockNumber} - ${Object.keys(ousdHolders).length} OUSD holders, ${
        Object.keys(wousdHolders).length
      } wOUSD holders\r`
    );
  }

  // Save the progress every 50000 blocks
  if (blockNumber % 50000 === 0 || blockNumber === SNAPSHOT_BLOCK) {
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
    fs.writeFileSync(
      "../scripts/1_data/mandatory_lockup_rewards.csv",
      csv.join("\n")
    );
    // Write merkle tree claims JSON structure
    fs.writeFileSync(
      "../scripts/1_data/mandatory_lockup_accounts.json",
      JSON.stringify(claims)
    );
  }

  done();
});

const calculateRewards = () => {
  console.log("\n");
  console.log("Calculating OUSD rewards");
  const filteredOusdHolders = Object.fromEntries(
    Object.entries(ousdHolders).filter(([k]) => !excludedContracts.includes(k))
  );
  const ousdRewards = cumulativeRewardScore(
    filteredOusdHolders,
    SNAPSHOT_BLOCK
  );
  console.log("Calculating wOUSD rewards");
  const wousdRewards = cumulativeRewardScore(wousdHolders, SNAPSHOT_BLOCK);

  const ousdScore = Object.values(ousdRewards).reduce<BigNumber>(
    (total: BigNumber, a: { [desc: string]: BigNumber }) => {
      return total.add(bigNumberify(Object.values(a)[0]));
    },
    bigNumberify(0)
  );

  const wousdScore = Object.values(wousdRewards).reduce<BigNumber>(
    (total: BigNumber, a: { [desc: string]: BigNumber }) => {
      return total.add(bigNumberify(Object.values(a)[0]));
    },
    bigNumberify(0)
  );

  const totalScore = ousdScore.add(wousdScore);

  const addresses = [
    ...new Set(Object.keys(ousdRewards).concat(Object.keys(wousdRewards))),
  ];

  const rewards = addresses.reduce((acc, address) => {
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

  const rewardTokenSum = Object.values(rewards).reduce(
    (total: BigNumber, account: { amount: BigNumber }) => {
      return total.add(account.amount);
    },
    bigNumberify(0)
  );

  console.log(`OUSD rewards ${ousdScore.mul(100).div(totalScore)}%`);
  console.log(`wOUSD rewards ${wousdScore.mul(100).div(totalScore)}%`);
  console.log(`Total OGV airdropped: ${rewardTokenSum}`);

  return rewards;
};

console.log("Searching for events...");

ethereumEvents.start(savedProgress.blockNumber);
