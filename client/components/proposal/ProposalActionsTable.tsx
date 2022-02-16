import { ethers } from "ethers";
import { contracts } from "constants";
import { truncateEthAddress } from "utils/index";

export const ProposalActionsTable = ({ proposalActions }) => {
  const decodeCalldata = (signature: string, calldata: string) => {
    const types = signature.split("(")[1].split(")")[0];
    return ethers.utils.defaultAbiCoder.decode(types.split(","), calldata);
  };

  const functionNameFromSignature = (signature: string) => {
    return signature.substring(0, signature.indexOf("("));
  };

  const argumentsFromSignature = (signature: string) => {
    return signature
      .substring(signature.indexOf("(") + 1, signature.indexOf(")"))
      .split(",");
  };

  const addressContractName = (address: string) => {
    return (
      contracts.find((c) => c.address === address)?.name ||
      truncateEthAddress(address)
    );
  };

  return (
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
              ).map((decodedData, index) => {
                return <div key={index}>{decodedData.toString()}</div>;
              })}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
