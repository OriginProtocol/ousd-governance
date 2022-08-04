/* OgvStaking contract requires for each of the accounts to perform delegation to their
 * own address in order for propose and cast vote function to work properly on the contract.
 *
 */
import { useStore } from "utils/store";
import { ZERO_ADDRESS } from "constants/index";

const useShowDelegationModalOption = () => {
  const { ogvDelegateeAddress } = useStore();

  // returns bool -> true if delegation modal needs to be shown
  return async () => {
    // account already has delegation set
    //const needToShowDelegation = ogvDelegateeAddress === ZERO_ADDRESS;
    const needToShowDelegation = true;
    if (needToShowDelegation) {
      useStore.setState({ ensureDelegationModalOpened: true });
    }

    return needToShowDelegation;
  };
};

export default useShowDelegationModalOption;
