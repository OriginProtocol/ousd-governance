import { BigNumber } from "ethers";
import { last } from "lodash";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

type BlockHistory = {
  blockNumber: number;
  amount: BigNumber;
};

type AccountHistory = {
  [address: string]: BlockHistory[];
};

type AccountReward = {
  [address: string]: BigNumber;
};

const bigNumberify = (value): BigNumber => {
  if (BigNumber.isBigNumber(value)) {
    return value;
  } else {
    return BigNumber.from(value);
  }
};

// Calculate a reward score based on the holdings of a token multipled by the
// number of blocks it was held for.
const cumulativeRewardScore = (
  addressHistory: { [address: string]: BlockHistory[] },
  snapshotBlock: number,
  rewardFromBlock = 0
) => {
  return Object.entries(addressHistory)
    .map(
      ([address, history]: [address: string, history: Array<BlockHistory>]) => {
        return {
          address,
          history,
          score: history.reduce(
            (acc, { blockNumber, amount }, currentIndex) => {
              // Ignore amounts less than 0, this can happen with OUSD due to
              // the rebased yield not being included
              if (bigNumberify(amount).lt(0)) return acc;
              // Block number of history event is lower than the
              // rewardFromBlock, ignore
              if (blockNumber < rewardFromBlock) return acc;

              // The history entry might have a block number lower than the start of rewards, so
              // set it to the highest of the two
              let firstBlock = Math.max(rewardFromBlock, blockNumber)
              let lastBlock: number
              if (currentIndex === history.length - 1) {
                  // Last history entry, use the difference between the given
                  // snapshot block and the history entry block
                  lastBlock = snapshotBlock;
              } else {
                // This is not the first or last history entry, use the
                // difference between the current history entry block and the
                // next history entry block
                lastBlock = Math.min(snapshotBlock, history[currentIndex + 1].blockNumber);
              }

              // console.log(`Reward amount from ${firstBlock} to ${lastBlock} for ${bigNumberify(amount).toString()}`)

              // Multiply amount by the difference in block numbers
              acc = acc.add(bigNumberify(amount).mul(lastBlock - firstBlock));
              return acc;
            },
            BigNumber.from(0)
          ),
        };
      }
    )
    .reduce(
      (obj, item) => Object.assign(obj, { [item.address]: item.score }), {}
    );
};

// Calculate a reward based on the last recorded balance of a token (i.e. up to
// SNAPSHOT_BLOCK).
const balanceRewardScore = (addressHistory: {
  [address: string]: BlockHistory[];
}) => {
  return Object.entries(addressHistory).reduce(
    (
      obj,
      [address, history]: [address: string, history: Array<BlockHistory>]
    ) => {
      obj[address] = history[history.length - 1].amount;
      return obj;
    },
    {}
  );
};

// This is a generic handler to handle ERC20 Transfer events that builds an
// object that can be later used in the reward scoring functions.
const handleERC20Transfer = (
  obj: { [address: string]: BlockHistory[] },
  blockNumber: number,
  from: string,
  to: string,
  value: string
) => {
  // Ignore zero value transfers
  if (value === "0") return obj;
  // Debit sender, unless its the zero address
  if (from !== ZERO_ADDRESS) {
    let amount = bigNumberify(last(obj[from]).amount).sub(bigNumberify(value));

    // Don't allow the users amount held to fall below 0. This is only a
    // problem for OUSD where the rebase yield isn't accounted for properly,
    // and so it is possible they transfer out more than was transferred in.
    // Note we are essentially ignoring rebasing for OUSD for the purposes of
    // the airdrop calculation.
    if (amount.lt(BigNumber.from(0))) amount = BigNumber.from(0);

    obj[from].push({
      blockNumber: blockNumber,
      // Subtract sent amount from last entry
      amount,
    });
  }
  // Credit the receiver, unless its the zero address
  if (to !== ZERO_ADDRESS) {
    if (obj[to] === undefined) {
      obj[to] = [
        {
          blockNumber: blockNumber,
          amount: bigNumberify(value),
        },
      ];
    } else {
      obj[to].push({
        blockNumber: blockNumber,
        amount: bigNumberify(last(obj[to]).amount).add(bigNumberify(value)),
      });
    }
  }
  return obj;
};

export {
  AccountHistory,
  AccountReward,
  BlockHistory,
  bigNumberify,
  balanceRewardScore,
  cumulativeRewardScore,
  handleERC20Transfer,
  ZERO_ADDRESS,
};
