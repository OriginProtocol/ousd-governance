import { useState } from "react";
import { useRouter } from "next/router";
import type { NextPage } from "next";
import ReactMarkdown from "react-markdown";
import { ProposalActionsTableEmpty } from "components/proposal/ProposalActionsTableEmpty";
import { ProposalActionsTable } from "components/proposal/ProposalActionsTable";
import { SectionTitle } from "components/SectionTitle";
import { PageTitle } from "components/PageTitle";
import { contracts } from "constants/index";
import { truncateEthAddress } from "utils/index";

const ProposalNew: NextPage = () => {
  const [proposalActions, setProposalActions] = useState<string[]>([]);
  const [justification, setJustification] = useState<string>("");
  const [modalOpen, setModalOpen] = useState(false);
  const [isPreview, setIsPreview] = useState(false);

  return (
    <>
      <PageTitle>New Proposal</PageTitle>
      <div className="-mt-6">
        <SectionTitle>Justification</SectionTitle>
      </div>
      <div className="tabs tabs-boxed mb-2">
        <a
          className={`tab ${!isPreview && "tab-active"}`}
          onClick={() => setIsPreview(false)}
        >
          Code
        </a>
        <a
          className={`tab ${isPreview && "tab-active"}`}
          onClick={() => setIsPreview(true)}
        >
          Preview
        </a>
      </div>
      {isPreview ? (
        <article className="prose p-6 bg-base-200 w-full max-w-full">
          <ReactMarkdown>{justification}</ReactMarkdown>
        </article>
      ) : (
        <div className="form-control w-full">
          <textarea
            className="textarea h-36 w-full textarea-bordered"
            onChange={(e) => setJustification(e.target.value)}
          >
            {justification}
          </textarea>
          <label className="label">
            <span className="label-text-alt">
              Please use{" "}
              <a href="https://www.markdownguide.org/basic-syntax/">Markdown</a>{" "}
              syntax
            </span>
          </label>
        </div>
      )}
      <SectionTitle>Governance Actions</SectionTitle>
      {proposalActions.length === 0 ? (
        <ProposalActionsTableEmpty onClickAdd={() => setModalOpen(true)} />
      ) : (
        <ProposalActionsTable />
      )}
      <ProposalActionAddModal
        modalOpen={modalOpen}
        onModalClose={() => setModalOpen(false)}
      />
    </>
  );
};

export const ProposalActionAddModal = ({
  modalOpen,
  onModalClose,
  onAddAction,
}) => {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [contractAddress, setContractAddress] = useState<string>("");
  const [contractAbi, setContractAbi] = useState<string>("");
  const [contractFunction, setContractFunction] = useState<string>("");

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
          <li className="step">Done</li>
        </ul>
        {step === 0 && (
          <ProposalActionAddContract
            onSelectContract={setContractAddress}
            onSelectAbi={setContractAbi}
          />
        )}
        {step === 1 && <ProposalActionAddFunction />}
        <div className="modal-action">
          <a
            href="#"
            onClick={() => (step < 2 ? setStep(step + 1) : onAddAction())}
            className="btn btn-primary"
          >
            {step < 2 ? "Next" : "Done"}
          </a>
          <a href="" onClick={onModalClose} className="btn">
            Close
          </a>
        </div>
      </div>
    </div>
  );
};

export const ProposalActionAddContract = ({
  onSelectContract,
  onSelectAbi,
}) => {
  const [isCustomContract, setIsCustomContract] = useState(false);
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
      <div className="py-4">
        {isCustomContract ? (
          <>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Contract address</span>
              </label>
              <input type="text" className="input input-bordered" />
            </div>
            <div className="form-control w-full mt-2">
              <label className="label">
                <span className="label-text">ABI</span>
              </label>
              <textarea
                className="textarea h-24 textarea-bordered"
                placeholder="ABI"
              ></textarea>
            </div>
          </>
        ) : (
          contracts && (
            <div className="form-control">
              <label className="label">
                <span className="label-text">Select contract</span>
              </label>
              <select
                className="select select-bordered w-full"
                onChange={(event) => {
                  onSelectContract(event.target.value);
                  onSelectAbi(
                    contracts.find((c) => c.address === event.target.value)?.abi
                  );
                }}
              >
                <option disabled={true}>Contract</option>
                {contracts.map(({ name, address }) => (
                  <option key={address} value={address}>
                    {name} {truncateEthAddress(address)}
                  </option>
                ))}
              </select>
            </div>
          )
        )}
      </div>
      <div className="divider">Or</div>
      <div className="text-center py-4">
        {isCustomContract ? (
          <a
            href="#"
            className="link link-primary"
            onClick={() => setIsCustomContract(false)}
          >
            Select from known contracts
          </a>
        ) : (
          <a
            href="#"
            className="link link-primary"
            onClick={() => setIsCustomContract(true)}
          >
            Enter address and ABI manually
          </a>
        )}
      </div>
    </div>
  );
};

const ProposalActionAddFunction = ({
  contractAbi,
  selectedFunction,
  onSelectFunction,
}) => {
  const contractFunctions =
    contractAbi &&
    contractAbi.filter(
      ({ type, stateMutability }) =>
        type === "function" && stateMutability.includes("payable")
    );

  const inputsForFunction =
    contractFunctions &&
    contractFunctions.find(({ name }) => name === selectedFunction)?.inputs;

  return (
    <>
      <div className="form-control w-full mt-2">
        <label className="label">
          <span className="label-text">Function</span>
        </label>
        <select
          className="select select-bordered w-full"
          onChange={(event) => onSelectFunction(event.target.value)}
          disabled={!selectedFunction}
        >
          <option disabled={true}>Choose function</option>
          {contractFunctions &&
            contractFunctions.map(({ name, inputs }) => (
              <option key={name} value={name}>
                {name}(
                {inputs.map(({ name, type }) => `${type} ${name}`).join(", ")})
              </option>
            ))}
        </select>
      </div>
      {inputsForFunction && (
        <div className="form-control w-full mt-2">
          <label className="label">
            <span className="label-text">Inputs</span>
          </label>
          <div className="flex flex-wrap">
            {inputsForFunction.map(({ name, type }) => (
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
    </>
  );
};

export default ProposalNew;
