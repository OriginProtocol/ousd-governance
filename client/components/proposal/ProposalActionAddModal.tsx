import { ethers } from "ethers";
import { useState } from "react";
import { AddActionContractForm } from "components/proposal/AddActionContractForm";
import { AddActionFunctionForm } from "components/proposal/AddActionFunctionForm";
import { encodeCalldata } from "utils/index";

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

  const reset = () => {
    setStep(0);
    setAddress("");
    setAbi("");
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
            onSubmit={(data) => {
              setAddress(data.address);
              setAbi(data.abi);
              setStep(1);
            }}
            onModalClose={onModalClose}
          />
        )}
        {step === 1 && (
          <AddActionFunctionForm
            abi={abi}
            onSubmit={(data) => {
              // TODO check ordering
              const { signature, ...inputs } = data;
              onActionAdd({
                target: address,
                signature: data.signature,
                calldata: encodeCalldata(signature, Object.values(inputs)),
              });
              reset();
              onModalClose();
            }}
            onModalClose={onModalClose}
            onPrevious={() => setStep(0)}
          />
        )}
      </div>
    </div>
  );
};
