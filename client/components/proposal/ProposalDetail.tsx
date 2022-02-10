import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Loading } from "components/Loading";
import { addressesContracts, governanceContract } from "constants";

export const ProposalDetail = ({ proposalId }) => {
  const [proposalActions, setProposalActions] = useState(null);

  useEffect(() => {
    const loadProposalActions = async () => {
      setProposalActions(await governanceContract.getActions(proposalId));
    };
    loadProposalActions();
  }, [proposalId]);

  const decodeCalldata = (signature: string, calldata: string) => {
    const types = signature.split("(")[1].split(")")[0];
    return ethers.utils.defaultAbiCoder.decode(types.split(","), calldata);
  };

  const functionNameFromSignature = (signature: String) => {
    return signature.substring(0, signature.indexOf("("));
  };

  const argumentsFromSignature = (signature: String) => {
    return signature
      .substring(signature.indexOf("(") + 1, signature.indexOf(")"))
      .split(",");
  };

  const addressContractName = (address: String) => {
    if (addressesContracts[address]) {
      return addressesContracts[address];
    }
    return address;
  };

  if (proposalActions === null) return <Loading />;

  return (
    <>
      <div className="pb-2 mb-5 border-b border-gray-200">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Vote</h3>
      </div>

      <div className="pb-2 mb-5 border-b border-gray-200">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Governance Actions
        </h3>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md mb-5">
        <table className="table table-zebra table-compact w-full">
          <thead>
            <tr>
              <td>Contract</td>
              <td>Function</td>
              <td>Argument Types</td>
              <td>Arguments</td>
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
                  >
                    {addressContractName(target)}
                  </a>
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
                  ).map((decodedData, index) => {
                    return <div key={index}>{decodedData.toString()}</div>;
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pb-2 mb-5 border-b border-gray-200">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Proposal Justification
        </h3>
      </div>
    </>
  );
};
