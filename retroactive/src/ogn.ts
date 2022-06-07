import fs from "fs";
import { ethers, BigNumber } from "ethers";
import EthereumEvents from "ethereum-events";
import { last } from "lodash";
import {
  AccountHistory,
  bigNumberify,
  balanceRewardScore,
  cumulativeRewardScore,
  handleERC20Transfer,
} from "./utils";
import {
  ognContract,
  ognStakingContract,
  ousd3CrvContract,
  ousd3CrvGaugeContract,
  convexContract,
  OGN_DEPLOY_BLOCK,
} from "./contracts";
import { ethereumEventsOptions, provider, web3 } from "./config";

// Amount of OGV being distributed to OGN holders
const OGN_AIRDROP_AMOUNT = 1000000000;
// Amount of OGV being distributed to participants in the prelaunch LM campaign
const LM_AIRDROP_AMOUNT = 50000000;
// When the snapshot should be taken
const SNAPSHOT_BLOCK = 14888133;
// Announce block, i.e. start of LM campaign
// https://etherscan.io/block/14881677
const ANNOUNCE_BLOCK = 14881677;
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
    ognStakers: [],
    ousd3Crv: {},
    ousd3CrvGauge: {},
    convexLiquidity: {},
  };
}

let {
  ognHolders,
  ognStakers,
  ousd3Crv,
  ousd3CrvGauge,
}: {
  ognHolders: AccountHistory;
  ognStakers: Array<String>;
  ousd3Crv: AccountHistory;
  ousd3CrvGauge: AccountHistory;
} = savedProgress;
const { convexLiquidity }: { convexLiquidity: AccountHistory } = savedProgress;

const contracts = [
  ognContract,
  ognStakingContract,
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
const handleCurveTransfer = async (blockNumber: number, event) => {
  ousd3Crv = handleERC20Transfer(
    ousd3Crv,
    blockNumber,
    event.values.sender,
    event.values.receiver,
    event.values.value
  );
};

// Handler for OUSD3CRV-f-gauge transfer events
const handleCurveGaugeTransfer = (blockNumber: number, event) => {
  ousd3CrvGauge = handleERC20Transfer(
    ousd3CrvGauge,
    blockNumber,
    event.values.sender,
    event.values.receiver,
    event.values.value
  );
};

// Handler for OGN staking events. This builds a list of all stakers and the
// principal + interest amount will be calculated using the contract method
// totalCurrentHoldings at SNAPSHOT_BLOCK.
const handleStakingEvent = (blockNumber: number, event) => {
  let address: string;
  if (event.name === "Staked") {
    address = event.values.user;
  } else if (event.name === "StakesTransferred") {
    address = event.values.toUser;
  }
  if (ognStakers.indexOf(address) === -1) ognStakers.push(address);
};

// Handler for Convex events
const handleConvexEvent = async (blockNumber: number, event) => {
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
  async (blockNumber: number, events: [any], done: () => void) => {
    for (const event of events) {
      if (event.to === ognContract.address) {
        handleOgnTransfer(blockNumber, event);
      } else if (event.to === ognStakingContract.address) {
        handleStakingEvent(blockNumber, event);
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
        `${blockNumber} - ${Object.keys(ognHolders).length} OGN holders, ${
          Object.keys(ognStakers).length
        } OGN Stakers, ${Object.keys(ousd3Crv).length} OUSD3CRV - f holders, ${
          Object.keys(ousd3CrvGauge).length
        } OUSD3CRV - f - gauge holders, ${
          Object.keys(convexLiquidity).length
        } Convex providers\r`
      );
    }

    // Save the progress every 50000 blocks
    if (blockNumber % 50000 === 0) {
      savedProgress = {
        blockNumber,
        ognHolders,
        ousd3Crv,
        ousd3CrvGauge,
        convexLiquidity,
      };
      fs.writeFileSync(PROGRESS_FILE, JSON.stringify(savedProgress));
    }

    if (blockNumber === SNAPSHOT_BLOCK) {
      ethereumEvents.stop();

      const claims = calculateRewards();

      const csv = Object.entries(claims).map(
        ([address, data]: [address: string, data: any]) => {
          return `${address}, ${["ogn", "ousd3Crv", "ousd3CrvGauge", "convex"]
            .map((key) =>
              data.split[key] === undefined ? 0 : data.split[key].toString()
            )
            .join(",")}, ${data.amount}`;
        }
      );

      // Write a CSV for for easier verification
      fs.writeFileSync("ogn-rewards.csv", csv.join("\n"));
      // Write merkle tree claims JSON structure
      fs.writeFileSync("ogn-claims.json", JSON.stringify(claims));
    }

    done();
  }
);

const calculateRewards = () => {
  console.log("\n");
  console.log("Calculating OGN rewards");
  const ognRewards = balanceRewardScore(ognHolders);

  const ognStakingContractInstance = new ethers.Contract(
    ognStakingContract.address,
    ognStakingContract.abi,
    provider
  );
  console.log("Calculating OGN staking rewards");
  const ognStakingRewards = ognStakers.reduce(
    (obj: object, address: string) => {
      // Use blockTag to query at the snapshot block. This requires Alchemy for the
      // provider URL.
      // TODO: verify this is returning correctly.
      obj[address] = ognStakingContractInstance.totalCurrentHoldings(address, {
        blockTag: SNAPSHOT_BLOCK,
      });
      return obj;
    },
    {}
  );
  // All the remaining rewards should calculate holding BETWEEN the SNAPSHOT_BLOCK and
  // ANNOUNCE_BLOCK
  console.log("Calculating OUSD3CRV-f rewards");
  const ousd3CrvRewards = cumulativeRewardScore(
    ousd3Crv,
    SNAPSHOT_BLOCK,
    ANNOUNCE_BLOCK
  );
  console.log("Calculating OUSD3CRV-f-gauge rewards");
  const ousd3CrvGaugeRewards = cumulativeRewardScore(
    ousd3CrvGauge,
    SNAPSHOT_BLOCK,
    ANNOUNCE_BLOCK
  );
  console.log("Calculating Convex rewards");
  const convexRewards = cumulativeRewardScore(
    convexLiquidity,
    SNAPSHOT_BLOCK,
    ANNOUNCE_BLOCK
  );

  // Calculate the sum of all reward scores for the OGN airdrop
  const totalOgnHoldersScore = Object.values(ognRewards).reduce<BigNumber>(
    (total: BigNumber, a: { [desc: string]: BigNumber }) => {
      return total.add(bigNumberify(Object.values(a)[0]));
    },
    bigNumberify(0)
  );

  // Calculate the sum of all reward scores for OGN Staking
  const totalOgnStakersScore = Object.values(
    ognStakingRewards
  ).reduce<BigNumber>((total: BigNumber, amount: BigNumber) => {
    return total.add(amount);
  }, bigNumberify(0));

  const totalOgnScore = totalOgnHoldersScore.add(totalOgnStakersScore);

  // Calculate the sum of all rewards scores for the LM campaign
  const totalLiquidityMiningScore = Object.values(ousd3CrvRewards)
    .concat(Object.values(ousd3CrvGaugeRewards))
    .concat(Object.values(convexRewards))
    .reduce((total: BigNumber, a: { [desc: string]: BigNumber }) => {
      return total.add(bigNumberify(Object.values(a)[0]));
    }, bigNumberify(0));

  // List of all addresses
  const addresses = [
    ...new Set(
      Object.keys(ognRewards)
        .concat(Object.keys(ousd3CrvRewards))
        .concat(Object.keys(ousd3CrvGaugeRewards))
        .concat(Object.keys(convexRewards))
    ),
  ];

  return addresses.reduce((acc, address) => {
    const ognReward = ognRewards[address]
      ? ognRewards[address].mul(OGN_AIRDROP_AMOUNT).div(totalOgnScore)
      : bigNumberify(0);

    const ognStakingReward = ognStakingRewards[address]
      ? ognStakingRewards[address].mul(OGN_AIRDROP_AMOUNT).div(totalOgnScore)
      : bigNumberify(0);

    const ousd3CrvReward = ousd3CrvRewards[address]
      ? ousd3CrvRewards[address]
          .mul(LM_AIRDROP_AMOUNT)
          .div(totalLiquidityMiningScore)
      : bigNumberify(0);

    const ousd3CrvGaugeReward = ousd3CrvGaugeRewards[address]
      ? ousd3CrvGaugeRewards[address]
          .mul(LM_AIRDROP_AMOUNT)
          .div(totalLiquidityMiningScore)
      : bigNumberify(0);

    const convexReward = convexRewards[address]
      ? convexRewards[address]
          .mul(LM_AIRDROP_AMOUNT)
          .div(totalLiquidityMiningScore)
      : bigNumberify(0);

    acc[address] = {
      amount: ognReward
        .add(ousd3CrvReward)
        .add(ousd3CrvGaugeReward)
        .add(convexReward),
      split: {
        ogn: ognReward,
        ognStaking: ognStakingReward,
        ousd3Crv: ousd3CrvReward,
        ousd3GaugeCrv: ousd3CrvGaugeReward,
        convex: convexReward,
      },
    };
    return acc;
  }, {});
};

console.log("Searching for events...");

ethereumEvents.start(savedProgress.blockNumber);
