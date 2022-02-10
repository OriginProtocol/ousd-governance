import { useState } from "react";
import type { NextPage } from "next";
import { ProposalActionsTableEmpty } from "components/proposal/ProposalActionsTableEmpty";
import { abi } from "constants/index";

const ProposalNew: NextPage = () => {
  const [proposalActions, setProposalActions] = useState<string[]>([]);
  const [displayAddActionForm, setDisplayAddActionForm] =
    useState<boolean>(false);

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pb-6">
        <h1 className="text-2xl font-semibold text-gray-900">New Proposal</h1>
      </div>
      {displayAddActionForm ? (
        <ProposalActionAddForm />
      ) : proposalActions.length === 0 ? (
        <ProposalActionsTableEmpty
          onClickAdd={() => setDisplayAddActionForm(true)}
        />
      ) : (
        <>Actions</>
      )}
    </>
  );
};

export const ProposalActionAddForm = () => {
  const [selectedContract, setSelectedContract] = useState<string>("");
  const [selectedFunction, setSelectedFunction] = useState<string>("");

  const selectedContractFunctions =
    selectedContract &&
    abi[selectedContract] &&
    abi[selectedContract].filter(
      ({ type, stateMutability }) =>
        type === "function" && stateMutability.includes("payable")
    );

  const inputsForSelectedFunction =
    selectedFunction &&
    abi[selectedContract] &&
    abi[selectedContract].find(({ name }) => name === selectedFunction)?.inputs;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
      {abi && (
        <div className="form-control">
          <label className="label">
            <span className="label-text">Choose contract</span>
          </label>
          <select
            className="select select-bordered w-full max-w-xs"
            onChange={(event) => setSelectedContract(event.target.value)}
          >
            <option disabled={true}>Contract</option>
            {Object.entries(abi).map(([name]) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      )}
      {selectedContractFunctions && (
        <div className="form-control w-full mt-2">
          <label className="label">
            <span className="label-text">Function</span>
          </label>
          <select
            className="select select-bordered w-full max-w-lg"
            onChange={(event) => setSelectedFunction(event.target.value)}
          >
            <option disabled={true}>Choose function</option>
            {selectedContractFunctions.map(({ name, inputs }) => (
              <option key={name} value={name}>
                {name}(
                {inputs.map(({ name, type }) => `${type} ${name}`).join(", ")})
              </option>
            ))}
          </select>
        </div>
      )}
      {inputsForSelectedFunction && (
        <div className="form-control w-full mt-2">
          <label className="label">
            <span className="label-text">Inputs</span>
          </label>
          <div className="flex flex-wrap">
            {inputsForSelectedFunction.map(({ name, type }) => (
              <div className="w-full sm:w-1/2 md:w-1/3 px-3 mb-6" key={name}>
                <label className="label">
                  <span className="label-text">{name}</span>
                </label>
                <input
                  className="input input-bordered w-full"
                  type="text"
                  placeholder={type}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProposalNew;
