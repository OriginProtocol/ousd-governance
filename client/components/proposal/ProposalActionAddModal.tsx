import { ethers } from "ethers";
import { useState } from "react";
import { AddActionContractForm } from "components/proposal/AddActionContractForm";
import { AddActionFunctionForm } from "components/proposal/AddActionFunctionForm";
import { encodeCalldata } from "utils/index";
import { contracts, mainnetProvider } from "constants/index";

export const ProposalActionAddModal = ({
  modalOpen,
  onModalClose,
  onActionAdd,
}: {
  modalOpen: boolean;
  onModalClose: Function;
}) => {
  const [step, setStep] = useState(0);
  const [address, setAddress] = useState<string>("");
  const [abi, setAbi] = useState<string>("");

  const [fetchingProxy, setFetchingProxy] = useState(false);
  const [isProxy, setIsProxy] = useState<boolean>(false);
  const [implementationAddress, setImplementationAddress] =
    useState<string>("");
  const [hasImplementationAbi, setHasImplementationAbi] = useState<string>("");

  const reset = () => {
    setStep(0);
    setAddress("");
    setAbi("");
    setIsProxy(false);
    setHasImplementationAbi(false);
    setImplementationAddress("");
  };

  return (
    <div
      id="proposal-add-modal"
      className={`modal ${modalOpen && "modal-open"}`}
    >
      <div className="modal-box">
        <ul className="steps steps-vertical md:steps-horizontal w-full mb-5">
          <li className="step step-primary">Contract</li>
          <li className={`step ${step === 1 && "step-primary"}`}>
            Function and Inputs
          </li>
        </ul>
        {step === 0 && (
          <AddActionContractForm
            onChange={async (data) => {
              const { address, abi } = data;

              // Check contract selected abi for implementation method
              const implementationFunction = abi.find(
                ({ type, name }) =>
                  type === "function" && name === "implementation"
              );

              // If present, call it and get the implementation address
              if (implementationFunction) {
                const proxyContract = new ethers.Contract(
                  address,
                  abi,
                  mainnetProvider
                );

                setFetchingProxy(true);
                const implementationAddress =
                  await proxyContract.implementation();
                setFetchingProxy(false);

                if (implementationAddress) {
                  setIsProxy(true);
                  setImplementationAddress(implementationAddress);

                  // Check that the implementation address exists in our contracts list
                  const implementationData = contracts.find(
                    ({ address }) => address === implementationAddress
                  );

                  // If present, populate state
                  if (implementationData) {
                    setHasImplementationAbi(true);
                    setAddress(implementationData.address);
                    setAbi(implementationData.abi);
                  } else {
                    setHasImplementationAbi(false);
                    setAddress(address);
                    setAbi(abi);
                  }
                }
              } else {
                setIsProxy(false);
                setHasImplementationAbi(false);
                setAddress(address);
                setAbi(abi);
              }
            }}
            fetchingProxy={fetchingProxy}
            isProxy={isProxy}
            implementationAddress={implementationAddress}
            hasImplementationAbi={hasImplementationAbi}
            onSubmit={() => {
              setStep(1);
            }}
            onModalClose={() => {
              reset();
              onModalClose();
            }}
          />
        )}
        {step === 1 && (
          <AddActionFunctionForm
            abi={abi}
            address={address}
            hasImplementationAbi={hasImplementationAbi}
            onContractChange={(data) => {
              setAddress(data.address);
              setAbi(data.abi);
            }}
            onSubmit={(data) => {
              // TODO check ordering
              const { signature, address, abi, ...inputs } = data;
              onActionAdd({
                target: address,
                signature: data.signature,
                calldata: encodeCalldata(signature, Object.values(inputs)),
              });
              reset();
              onModalClose();
            }}
            onModalClose={() => {
              reset();
              onModalClose();
            }}
            onPrevious={() => {
              setStep(0);
              reset();
            }}
          />
        )}
      </div>
    </div>
  );
};
