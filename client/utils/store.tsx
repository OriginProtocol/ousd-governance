import create from "zustand";

type Web3DataType = {
  provider?: any;
  web3Provider?: any;
  address?: string;
  chainId?: number;
  contracts: Array<any>;
};

type StoreType = Web3DataType & {
  reset: () => void;
};

const defaultState: Web3DataType = {
  provider: null,
  web3Provider: null,
  address: undefined,
  chainId: undefined,
  contracts: [],
};

export const useStore = create<StoreType>((set) => ({
  ...defaultState,
  reset: () => set(defaultState),
}));
