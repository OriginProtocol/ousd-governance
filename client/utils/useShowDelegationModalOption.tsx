/* OgvStaking contract requires for each of the accounts to perform delegation to their
 * own address in order for propose and cast vote function to work properly on the contract.
 *
 */
import { useState, useEffect, useCallback } from "react";
import { useStore } from "utils/store";
import { ZERO_ADDRESS } from "constants/index";

const useShowDelegationModalOption = () => {
  const { ogvDelegateeAddress, refreshStatus } = useStore();
  const [needToShowDelegation, setNeedToShowDelegation] = useState(true);

  useEffect(() => {
    setNeedToShowDelegation(ogvDelegateeAddress === ZERO_ADDRESS);
  }, [refreshStatus.ogvStakingDelegation, ogvDelegateeAddress]);

  // returns bool -> true if delegation modal needs to be shown
  const showModalIfApplicable = useCallback(() => {
    if (needToShowDelegation) {
      useStore.setState({ ensureDelegationModalOpened: true });
    }

    return needToShowDelegation;
  }, [needToShowDelegation]);

  return {
    showModalIfApplicable,
    needToShowDelegation,
  };
};

export default useShowDelegationModalOption;
