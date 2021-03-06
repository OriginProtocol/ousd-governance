import create from "zustand";
import { ethers } from "ethers";

type Web3DataType = {
  provider?: any;
  web3Provider?: any;
  address?: string;
  chainId?: number;
  contracts: Object;
  balances: Object;
  existingLockup: Object;
  lockups: Array<Object>;
  allowances: Object;
  pendingTransactions: Array<any>;
  totalBalances: Object;
};

type StoreType = Web3DataType & {
  reset: () => void;
};

const defaultState: Web3DataType = {
  provider: null,
  web3Provider: null,
  address: undefined,
  chainId: null,
  contracts: {
    loaded: false,
  },
  balances: {
    ogv: ethers.BigNumber.from("0"),
    veOgv: ethers.BigNumber.from("0"),
    accruedRewards: ethers.BigNumber.from("0"),
  },
  existingLockup: {
    amount: ethers.BigNumber.from(0),
    end: ethers.BigNumber.from(0),
    existingEndWeeks: 0,
    existingEndDate: "",
  },
  claim: {
    claimOpensTs: process.env.CLAIM_OPENS,
    claimClosesTs: process.env.CLAIM_CLOSES,
    currentStep: 0,
  },
  lockups: [],
  recentLockups: [],
  allowances: {
    ogv: ethers.BigNumber.from("0"),
  },
  pendingTransactions: [],
  totalBalances: {
    totalSupplyOfOgv: ethers.BigNumber.from("0"),
    totalLockedUpOgv: ethers.BigNumber.from("0"),
    totalPercentageOfLockedUpOgv: 0,
    totalSupplyVeOgv: ethers.BigNumber.from("0"),
  },
  totalOgvLockedUp: ethers.BigNumber.from("0"),
  blockTimestamp: Math.ceil(Date.now() / 1000),
};

export const useStore = create<StoreType>((set) => ({
  ...defaultState,
  reset: () => set(defaultState),
}));
