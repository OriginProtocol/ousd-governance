import { useState } from "react";
import { useStore } from "utils/store";
import { useNetworkInfo } from "utils/index";
import {
  decodeCalldata,
  functionNameFromSignature,
  argumentsFromSignature,
  typesFromSignature,
  addressContractName,
  etherscanLink,
} from "utils/index";

export const ProposalActionsTable = ({
  proposalActions,
  ephemeral,
  onActionDelete,
}: {
  proposalActions: any;
  ephemeral?: boolean;
  onActionDelete?: Function;
}) => {
  const MAX_UINT256 =
    "115792089237316195423570985008687907853269984665640564039457584007913129639935";

  const { contracts } = useStore();
  const { envNetwork } = useNetworkInfo();
  const [modalOpen, setModalOpen] = useState(false);
  const [actionDeleteIndex, setActionDeleteIndex] = useState(null);

  let explorerPrefix: string | undefined;
  if (envNetwork === 1) {
    explorerPrefix = "https://etherscan.io/";
  } else if (envNetwork === 4) {
    explorerPrefix = "https://rinkeby.etherscan.io/";
  }

  return (
    <>
      {ephemeral && onActionDelete && (
        <ConfirmDeleteModal
          modalOpen={modalOpen}
          onConfirm={() => {
            onActionDelete(actionDeleteIndex);
            setModalOpen(false);
          }}
          onClose={() => setModalOpen(false)}
        />
      )}
      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr>
              <td className="pl-0">Contract</td>
              <td>Function</td>
              <td>Argument Types</td>
              <td>Arguments</td>
              {ephemeral && <td>Actions</td>}
            </tr>
          </thead>
          <tbody>
            {proposalActions.targets.map((target, index) => (
              <tr key={index}>
                <td className="pl-0">
                  {explorerPrefix ? (
                    <a
                      className="link link-primary"
                      href={`${explorerPrefix}address/${target}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {addressContractName(contracts, target)}
                    </a>
                  ) : (
                    <>{addressContractName(contracts, target)}</>
                  )}
                </td>
                <td>
                  {functionNameFromSignature(proposalActions.signatures[index])}
                </td>
                <td>
                  {argumentsFromSignature(
                    proposalActions.signatures[index]
                  ).map((argument, index) => (
                    <div key={index}>{argument}</div>
                  ))}
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
                      return (
                        <div key={i}>{etherscanLink(contracts, data)}</div>
                      );
                    } else if (type === "address[]") {
                      return data
                        .split(",")
                        .map((address) => (
                          <div key={index}>
                            {etherscanLink(contracts, address)}
                          </div>
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
                      className="btn btn-muted btn-circle btn-xs"
                      onClick={() => {
                        setModalOpen(true);
                        setActionDeleteIndex(index);
                      }}
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
      </div>
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
    <div id="confirm-modal" className={`modal ${modalOpen && "modal-open"}`}>
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
