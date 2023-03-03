import create from "zustand";
import { ethers, providers, BigNumber } from "ethers";

type Web3DataType = {
  web3Provider?: providers.JsonRpcProvider | null;
  ensureDelegationModalOpened: boolean;
  connectorName: string | null;
  walletSelectModalState: "Wallet" | "LedgerDerivation" | false;
  contracts: Object;
  ogvDelegateeAddress: string;
  balances: {
    ogv: BigNumber;
    veOgv: BigNumber;
    accruedRewards: BigNumber;
  };
  existingLockup: Object;
  lockups: Array<Object>;
  allowances: {
    ogv: BigNumber;
  };
  pendingTransactions: Array<any>;
  totalBalances: Object;
};

type StoreType = Web3DataType & {
  reset: () => void;
};

const defaultState: Web3DataType = {
  web3Provider: null,
  contracts: {
    loaded: false,
  },
  ensureDelegationModalOpened: false,
  connectorName: null,
  walletSelectModalState: false,
  balances: {
    ogv: BigNumber.from("0"),
    veOgv: BigNumber.from("0"),
    accruedRewards: BigNumber.from("0"),
  },
  ogvDelegateeAddress: "0x0000000000000000000000000000000000000000",
  existingLockup: {
    amount: BigNumber.from(0),
    end: BigNumber.from(0),
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
    ogv: BigNumber.from("0"),
  },
  pendingTransactions: [],
  totalBalances: {
    totalSupplyOfOgv: BigNumber.from("0"),
    totalLockedUpOgv: BigNumber.from("0"),
    totalPercentageOfLockedUpOgv: 0,
    totalSupplyVeOgv: BigNumber.from("0"),
    optionalDistributorOgv: BigNumber.from("0"),
    mandatoryDistributorOgv: BigNumber.from("0"),
  },
  totalOgvLockedUp: ethers.BigNumber.from("0"),
  blockTimestamp: Math.ceil(Date.now() / 1000),
  // Is increased by 1 when relevant information is getting refreshed
  refreshStatus: {
    ogvStakingDelegation: 0,
  },
};

export const useStore = create<StoreType>((set) => ({
  ...defaultState,
  reset: () => set(defaultState),
}));
