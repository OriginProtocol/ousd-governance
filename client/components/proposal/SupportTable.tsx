import { FunctionComponent } from "react";
import { Address } from "components/Address";
import TokenAmount from "components/TokenAmount";
import { ethers } from "ethers";

interface SupportTableProps {
  voters: Array<object>;
}

const SupportTable: FunctionComponent<SupportTableProps> = ({ voters }) => {
  return (
    <table className="table table-compact w-full">
      <thead>
        <tr>
          <th className="pl-0">Address</th>
          <th>Votes</th>
        </tr>
      </thead>
      <tbody>
        {voters.map((voter) => (
          <tr key={voter.address}>
            <td className="pl-0">
              <Address address={voter.address} />
            </td>
            <td>
              <TokenAmount
                amount={ethers.utils.formatUnits(
                  ethers.BigNumber.from(voter.votes)
                )}
              />
            </td>
          </tr>
        ))}
        {voters.length < 1 && (
          <tr>
            <td className="pl-0">-</td>
            <td>-</td>
          </tr>
        )}
      </tbody>
    </table>
  );
};

export { SupportTable };
