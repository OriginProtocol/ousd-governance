import create from "zustand";
import { ethers } from "ethers";

type Web3DataType = {
  provider?: any;
  web3Provider?: any;
  address?: string;
  chainId?: number;
  contracts: Object;
  pendingTransactions: Array<any>;
};

type StoreType = Web3DataType & {
  reset: () => void;
};

const defaultState: Web3DataType = {
  provider: null,
  web3Provider: null,
  address: undefined,
  chainId: 31337,
  contracts: {
    loaded: false,
  },
  balances: {
    ogv: ethers.BigNumber.from("0"),
    vote_power: ethers.BigNumber.from("0"),
  },
  existingLockup: {
    amount: ethers.BigNumber.from(0),
    end: ethers.BigNumber.from(0),
    existingEndWeeks: 0,
  },
  allowances: {
    ogv: ethers.BigNumber.from("0"),
  },
  pendingTransactions: [],
};

export const useStore = create<StoreType>((set) => ({
  ...defaultState,
  reset: () => set(defaultState),
}));
