import { ethers } from "ethers";
import { useEffect, useState } from "react";
import { AddActionContractForm } from "components/proposal/AddActionContractForm";
import { AddActionFunctionForm } from "components/proposal/AddActionFunctionForm";
import { encodeCalldata } from "utils/index";
import { contracts } from "constants/index";

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

  const [isProxy, setIsProxy] = useState<boolean>(false);
  const [implementationAddress, setImplementationAddress] = useState<string>("");
  const [implementationAbi, setImplementationAbi] = useState<string>("");
  const [useImplementation, setUseImplementation] = useState(false);

  const handleUseImplementation = () => setUseImplementation(!useImplementation);

  const reset = () => {
    setStep(0);
    setAddress("");
    setAbi("");
    setIsProxy(false);
    setImplementationAddress("");
    setImplementationAbi("");
    setUseImplementation(false);
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
            onChange={(data) => {
              setIsProxy(data.name.includes('Proxy'));
              const implementationName = data.name.replace('Proxy', '');
              const implementation = contracts.find((c) => c.name === implementationName);
              if(implementation){
                setImplementationAddress(implementation.address);
                setImplementationAbi(implementation.abi);
              } else {
                setImplementationAddress("");
                setImplementationAbi("");
              }
            }}
            onSubmit={(data) => {
              setAddress(data.address);
              setAbi(data.abi);
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
            onSubmit={(data) => {
              // TODO check ordering
              const { signature, ...inputs } = data;
              onActionAdd({
                target: useImplementation ? implementationAddress : address,
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
            onPrevious={() => setStep(0)}
            isProxy={isProxy}
            implementationAddress={implementationAddress}
            implementationAbi={implementationAbi}
            useImplementation={useImplementation}
            handleUseImplementation={handleUseImplementation}
          />
        )}
      </div>
    </div>
  );
};
