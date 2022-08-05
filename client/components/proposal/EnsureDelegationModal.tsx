import { useStore } from "utils/store";
import { useState } from "react";
import useAccountBalances from "utils/useAccountBalances";
import Modal from "components/Modal";

export const EnsureDelegationModal = () => {
  const { contracts, ensureDelegationModalOpened, address, rpcProvider } =
    useStore();
  /*
   * 0 - initial prompt to initiate contract delegation call
   * 1 - confirmation stage
   */
  const [stage, setStage] = useState(0);
  const [registerStatus, setRegisterStatus] = useState("ready");
  const { reloadOgvDelegation } = useAccountBalances();

  let registerButtonText = "";
  if (registerStatus === "ready") {
    registerButtonText = "Register";
  } else if (registerStatus === "waiting-for-user") {
    registerButtonText = "Confirm transaction";
  } else if (registerStatus === "waiting-for-network") {
    registerButtonText = "Waiting to be mined";
  }

  const onClose = () => {
    setStage(0);
    useStore.setState({ ensureDelegationModalOpened: false });
  };

  const handleRegistration = async () => {
    setRegisterStatus("waiting-for-user");
    // self delegate
    const transaction = await contracts.OgvStaking.delegate(address);
    setRegisterStatus("waiting-for-network");
    // wait for self delegation to be mined before continuing
    await rpcProvider.waitForTransaction(transaction.hash);
    setStage(1);
    setRegisterStatus("ready");
    /*
     * There is this weird race condition where immediately querying blockchain after the
     * update is made does not guarantee that returned state is up to date. For that reason
     * we don't query the delegatee address again and rather set it in the client.
     */
    useStore.setState({ ogvDelegateeAddress: address });
  };

  return (
    <Modal show={ensureDelegationModalOpened} handleClose={onClose}>
      <h2 className="font-bold text-3xl text-center mb-4">Register to Vote</h2>
      {stage === 0 && (
        <>
          <p className="text-center mb-4 px-4">
            Before you continue you need to register your account for voting &
            proposal creation.
          </p>
          <p className="text-center mb-12">
            This action needs to be performed only once.
          </p>
          <div className="flex">
            <button
              className="btn md:btn-lg rounded-full mr-4 flex-1"
              onClick={onClose}
            >
              Close
            </button>
            <button
              className="btn btn-primary md:btn-lg rounded-full flex-1"
              disabled={registerStatus != "ready"}
              onClick={handleRegistration}
            >
              {registerButtonText}
            </button>
          </div>
        </>
      )}

      {stage === 1 && (
        <>
          <p className="text-center mb-12 px-4">Done!</p>
          <div className="flex justify-center">
            <button
              className="btn btn-primary md:btn-lg rounded-full"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </>
      )}
    </Modal>
  );
};
