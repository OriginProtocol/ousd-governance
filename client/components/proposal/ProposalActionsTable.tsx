import { ethers } from "ethers";
import { contracts } from "constants";
import { truncateEthAddress } from "utils/index";

export const ProposalActionsTable = ({ proposalActions }) => {
  const decodeCalldata = (signature: string, calldata: string) => {
    const types = typesFromSignature(signature);
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

  const typesFromSignature = (signature: string) => {
    return signature.split("(")[1].split(")")[0];
  };

  const addressContractName = (address: string) => {
    return (
      contracts.find((c) => c.address === address)?.name ||
      truncateEthAddress(address)
    );
  };

  const etherscanLink = (address: string) => {
    return (
      <a
        className="link link-primary"
        href={`https://etherscan.io/address/${address}`}
        target="_blank"
        rel="noreferrer"
      >
        {addressContractName(address)}
      </a>
    );
  };

  const MAX_UINT256 =
    "115792089237316195423570985008687907853269984665640564039457584007913129639935";

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
              ).map((decodedData, i) => {
                const type = typesFromSignature(
                  proposalActions.signatures[index]
                ).split(",")[i];

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
          </tr>
        ))}
      </tbody>
    </table>
  );
};
