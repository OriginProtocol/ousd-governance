import { useStore } from "./store";
import { BigNumber } from "ethers";

import { injectedConnector } from "utils/connectors";
import { providerName } from "./web3";
import { isMobileMetaMask } from "./device";
import { AbstractConnector } from "@web3-react/abstract-connector";

export const walletLogin = (
  showLogin: () => void,
  activate: (i: AbstractConnector) => void
) => {
  const provider = providerName() || "";
  if (
    provider.match(
      "coinbase|imtoken|cipher|alphawallet|gowallet|trust|status|mist|parity"
    ) ||
    isMobileMetaMask()
  ) {
    activate(injectedConnector);
  } else if (showLogin) {
    showLogin();
  }

  // useStore.setState({
  //   provider,
  //   web3Provider,
  //   address,
  //   chainId: network.chainId,
  // });
};

export const login = (address: string) => {
  useStore.setState({ address });
};

export const logout = () => {
  useStore.setState({
    balances: {
      ogv: BigNumber.from("0"),
      veOgv: BigNumber.from("0"),
      accruedRewards: BigNumber.from("0"),
    },
    allowances: {
      ogv: BigNumber.from("0"),
    },
  });
};

// export const refetchUserData = () => {
//   AccountStore.update((s) => {
//     s.refetchUserData = true;
//   });
// };

// export const refetchStakingData = () => {
//   AccountStore.update((s) => {
//     s.refetchStakingData = true;
//   });
// };
