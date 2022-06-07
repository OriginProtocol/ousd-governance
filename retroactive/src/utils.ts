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

const rewardScore = (
  addressHistory: { [address: string]: BlockHistory[] },
  stopBlock: number,
  rewardFromBlock = 0
) => {
  // Calculate total rewards score by muiltiplying the amount of holdings by the block time held for
  return Object.entries(addressHistory)
    .map(
      ([address, history]: [address: string, history: Array<BlockHistory>]) => {
        return {
          address,
          history,
          score: history.reduce(
            (acc, { blockNumber, amount }, currentIndex) => {
              // Ignore amounts less than 0, this can happen with OUSD due to the rebased yield not being included
              if (bigNumberify(amount).lt(0)) return acc;
              // Block number of history event is lower than the rewardFromBlock, ignore
              if (blockNumber < rewardFromBlock) return acc;
              // First history entry, ignore because we need at least two entries to calculate amount * block time held for
              if (currentIndex === 0) return acc;

              // The two blocks to calculate the difference between
              let firstBlock: number, lastBlock: number;
              if ((currentIndex = history.length - 1)) {
                // Last history entry, use the difference between the given stop block and the history entry block
                firstBlock = stopBlock;
                lastBlock = Math.max(rewardFromBlock, blockNumber);
              } else {
                // This is not the first or last history entry, use the difference between the current history entry block and
                // the last history entry block
                firstBlock = blockNumber;
                lastBlock = Math.max(
                  rewardFromBlock,
                  // Previous history entries block number
                  history[currentIndex - 1].blockNumber
                );
              }
              // Multiply amount by the difference in block numbers
              acc = acc.add(bigNumberify(amount).mul(firstBlock - lastBlock));
              return acc;
            },
            BigNumber.from(0)
          ),
        };
      }
    )
    .reduce(
      (obj, item) => Object.assign(obj, { [item.address]: item.score }),
      {}
    );
};

// This is a generic handler to handle ERC20 Transer events that builds an object that
// can be later used to calculate amount of an ERC20 held multiplied by the number of blocks
// it was held for.
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

    // Don't allow the users amount held to fall below 0. This is only a problem for OUSD where the
    // rebase yield isn't accounted for properly, and so it is possible they transfer out more than
    // was transferred in. Note we are essentially ignoring rebasing for OUSD for the purposes of the
    // airdrop calculation.
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
  rewardScore,
  handleERC20Transfer,
  ZERO_ADDRESS,
};
