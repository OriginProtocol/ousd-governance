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
  },
  existingLockup: {
    amount: ethers.BigNumber.from(0),
    end: ethers.BigNumber.from(0),
    existingEndWeeks: 0,
    existingEndDate: "",
  },
  lockups: {
    lockups: [],
    totalOgvLockedUp: ethers.BigNumber.from("0"),
  },
  recentLockups: [],
  allowances: {
    ogv: ethers.BigNumber.from("0"),
  },
  pendingTransactions: [],
  totalBalances: {
    totalSupplyOfOgv: ethers.BigNumber.from("0"),
    totalLockedUpOgv: ethers.BigNumber.from("0"),
  },
  totalOgvLockedUp: ethers.BigNumber.from("0"),
};

export const useStore = create<StoreType>((set) => ({
  ...defaultState,
  reset: () => set(defaultState),
}));
