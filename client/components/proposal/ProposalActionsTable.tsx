import { useState } from "react";
import {
  decodeCalldata,
  functionNameFromSignature,
  argumentsFromSignature,
  typesFromSignature,
  addressContractName,
  etherscanLink,
} from "utils/index";

export const ProposalActionsTable = ({ proposalActions, ephemeral }) => {
  const MAX_UINT256 =
    "115792089237316195423570985008687907853269984665640564039457584007913129639935";

  const [modalOpen, setModalOpen] = useState(false);
  const onDeleteAction = (actionIndex: number) => {
    setModalOpen(false);
  };

  return (
    <>
      {ephemeral && (
        <ConfirmDeleteModal
          modalOpen={modalOpen}
          onConfirm={onDeleteAction}
          onClose={() => setModalOpen(false)}
        />
      )}
      <table className="table table-zebra table-compact w-full">
        <thead>
          <tr>
            <td>Contract</td>
            <td>Function</td>
            <td>Argument Types</td>
            <td>Arguments</td>
            {ephemeral && <td>Actions</td>}
          </tr>
        </thead>
        <tbody>
          {proposalActions.targets.map((target, index) => (
            <tr key={index}>
              <td>
                <a
                  className="link link-primary"
                  href={`https://etherscan.io/address/${target}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {addressContractName(target)}
                </a>
              </td>
              <td>
                {functionNameFromSignature(proposalActions.signatures[index])}
              </td>
              <td>
                {argumentsFromSignature(proposalActions.signatures[index]).map(
                  (argument, index) => (
                    <div key={index}>{argument}</div>
                  )
                )}
              </td>
              <td>
                {decodeCalldata(
                  proposalActions.signatures[index],
                  proposalActions.calldatas[index]
                ).map((decodedData, i) => {
                  const type = typesFromSignature(
                    proposalActions.signatures[index]
                  )[i];

                  const data = decodedData.toString();

                  if (type === "address") {
                    return <div key={i}>{etherscanLink(data)}</div>;
                  } else if (type === "address[]") {
                    return data
                      .split(",")
                      .map((address) => (
                        <div key={index}>{etherscanLink(address)}</div>
                      ));
                  } else {
                    return (
                      <div key={i}>
                        {data === MAX_UINT256 ? "uint256(-1)" : data}
                      </div>
                    );
                  }
                })}
              </td>
              {ephemeral && (
                <td>
                  <button
                    className="btn btn-secondary btn-xs"
                    onClick={() => setModalOpen(true)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
};

export const ConfirmDeleteModal = ({
  modalOpen,
  onConfirm,
  onClose,
}: {
  modalOpen: boolean;
  onConfirm: Function;
  onClose: Function;
}) => {
  return (
    <div id="confirm-modal" className={`modal ${modalOpen && "model-open"}`}>
      <div className="modal-box">
        <p className="py-4">Are you sure you want to remove this action?</p>
        <div className="modal-action">
          <button className="btn btn-primary" onClick={() => onConfirm()}>
            Yes
          </button>
          <button className="btn btn-secondary" onClick={() => onClose()}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
