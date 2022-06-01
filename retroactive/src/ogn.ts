/// Merkle tree generator for airdrop of OGV for OGN holders and prelaunch liquidity mining campaign for OUSD
//
//
// Airdrop is calculated using amount * number of blocks for:
//    - Holders of OUSD3CRV-f
//    - Holders of OUSD3CRV-f-gauge (i.e. OUSD3CRV-f staked in the Curve gauge)
//    - Liquidity staked in Convex

import fs from "fs";
import EthereumEvents from "ethereum-events";
import { last } from "lodash";
import { bigNumberify, rewardScore, handleERC20Transfer } from "./utils";
import {
  ognContract,
  ousd3CrvContract,
  ousd3CrvGaugeContract,
  convexContract,
} from "./contracts";
import { ethereumEventsOptions, web3 } from "./config";

// Amount of OGV being distributed to OGN holders
const OGN_AIRDROP_AMOUNT = 1000000000;

// Amount of OGV being distributed to participants in the prelaunch LM campaign
const LM_AIRDROP_AMOUNT = 50000000;

// When the snapshot should be taken
const SNAPSHOT_BLOCK = 14592991;

// Announce block, i.e. start of LM campaign
const ANNOUNCE_BLOCK = 14592991;

const PROGRESS_FILE = "ogn-progress.json";

let savedProgress;
try {
  savedProgress = JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf8"));
  console.log(
    `Using progress file to resume from ${savedProgress.blockNumber}`
  );
} catch (error) {
  console.log("No progress file, starting from first deployment");
  savedProgress = {
    blockNumber: OGN_DEPLOY_BLOCK, // OGN was the first deployment
    ognHolders: {},
    ousd3Crv: {},
    ousd3CrvGauge: {},
    convexLiquidity: {},
  };
}

let { ognHolders, ousd3Crv, ousd3CrvGauge, convexLiquidity } = savedProgress;

const contracts = [
  ognContract,
  ousd3CrvContract,
  ousd3CrvGaugeContract,
  convexContract,
];

const ethereumEvents = new EthereumEvents(
  web3,
  contracts,
  ethereumEventsOptions
);

// Handler for OGN transfer events
const handleOgnTransfer = async (blockNumber: number, event) => {
  ognHolders = handleERC20Transfer(
    ognHolders,
    blockNumber,
    event.values.from,
    event.values.to,
    event.values.value
  );
};

// Handler for OUSD3CRV-f transfer events
const handleCurveTransfer = async (blockNumber: Number, event) => {
  ousd3Crv = handleERC20Transfer(
    ousd3Crv,
    blockNumber,
    event.values.sender,
    event.values.receiver,
    event.values.value
  );
};

// Handler for OUSD3CRV-f-gauge transfer events
const handleCurveGaugeTransfer = (blockNumber: Number, event) => {
  ousd3CrvGauge = handleERC20Transfer(
    ousd3CrvGauge,
    blockNumber,
    event.values.sender,
    event.values.receiver,
    event.values.value
  );
};

// Handler for Convex events
const handleConvexEvent = async (blockNumber: Number, event) => {
  if (event.name == "Staked") {
    // This only needs to be done once in add liquidity because it should
    // always be initialised before removing liquidity
    if (convexLiquidity[event.values.user] === undefined) {
      convexLiquidity[event.values.user] = [
        {
          blockNumber,
          amount: bigNumberify(event.values.amount),
        },
      ];
    } else {
      convexLiquidity[event.values.user].push({
        blockNumber,
        amount: bigNumberify(
          last(convexLiquidity[event.values.user]).amount
        ).add(bigNumberify(event.values.amount)),
      });
    }
  } else if (event.name == "Withdrawn") {
    convexLiquidity[event.values.user].push({
      blockNumber,
      amount: bigNumberify(last(convexLiquidity[event.values.user]).amount).sub(
        bigNumberify(event.values.amount)
      ),
    });
  }
};

ethereumEvents.on(
  "block.confirmed",
  async (blockNumber, events, done: Function) => {
    for (const event of events) {
      if (event.to === ognContract.address) {
        handleOgnTransfer(blockNumber, event);
      } else if (event.to === ousd3CrvContract.address) {
        handleCurveTransfer(blockNumber, event);
      } else if (event.to === ousd3CrvGaugeContract.address) {
        handleCurveGaugeTransfer(blockNumber, event);
      } else if (event.to === convexContract.address) {
        handleConvexEvent(blockNumber, event);
      }
    }

    if (blockNumber) {
      process.stdout.write(
        `${blockNumber} - ${Object.keys(ognHolders).length} OGN holders, ${Object.keys(ousd3Crv).length
        } OUSD3CRV-f holders, ${Object.keys(ousd3CrvGauge).length
        } OUSD3CRV-f-gauge holders, ${Object.keys(convexLiquidity).length
        } Convex providers\r`
      );
    }

    // Save the progress every 50000 blocks
    if (blockNumber % 50000 === 0) {
      savedProgress = {
        blockNumber,
        ousd3Crv,
        ousd3CrvGauge,
        convexLiquidity,
      };
      fs.writeFileSync(PROGRESS_FILE, JSON.stringify(savedProgress));
    }

    if (blockNumber === SNAPSHOT_BLOCK) {
      console.log("\n");
      ethereumEvents.stop();

      console.log("Calculating OGN rewards");
      const ognRewards = rewardScore("ogn", ognHolders, SNAPSHOT_BLOCK);

      // All the remaining rewards should calculate holding BETWEEN the SNAPSHOT_BLOCK and
      // ANNOUNCE_BLOCK
      console.log("Calculating OUSD3CRV-f rewards");
      const ousd3CrvRewards = rewardScore(
        "ousd3Crv",
        ousd3Crv,
        SNAPSHOT_BLOCK,
        ANNOUNCE_BLOCK
      );

      console.log("Calculating OUSD3CRV-f-gauge rewards");
      const ousd3CrvGaugeRewards = rewardScore(
        "ousd3CrvGauge",
        ousd3CrvGauge,
        SNAPSHOT_BLOCK,
        ANNOUNCE_BLOCK
      );

      console.log("Calculating Conved rewards");
      const convexRewards = rewardScore(
        "convex",
        convexLiquidity,
        SNAPSHOT_BLOCK,
        ANNOUNCE_BLOCK
      );
    }

    done();
  }
);

console.log("Searching for events...");

ethereumEvents.start(savedProgress.blockNumber);
