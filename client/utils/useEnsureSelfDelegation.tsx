/* OgvStaking contract requires for each of the accounts to perform delegation to their
 * own address in order for propose and cast vote function to work properly on the contract.
 */
import { useEffect, useState } from "react";
import { useStore } from "utils/store";
import useAccountBalances from "utils/useAccountBalances";
import { ZERO_ADDRESS } from "constants/index";

const useEnsureSelfDelegation = () => {
  const { ogvDelegateeAddress, contracts, address, rpcProvider } = useStore();
  const { reloadOgvDelegation } = useAccountBalances();

  return async () => {
    // account already has delegation set
    if (ogvDelegateeAddress !== ZERO_ADDRESS) {
      return;
    }

    // self delegate
    const transaction = await contracts.OgvStaking.delegate(address);
    // wait for self delegation to be mined before continuing
    await rpcProvider.waitForTransaction(transaction.hash);
    reloadOgvDelegation();
  };
};

export default useEnsureSelfDelegation;
