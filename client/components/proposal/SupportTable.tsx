import { FunctionComponent } from "react";
import { Address } from "components/Address";
import TokenAmount from "components/TokenAmount";
import { ethers, BigNumberish, BigNumber } from "ethers";

interface SupportTableProps {
  voters: Array<object>;
}

const SupportTable: FunctionComponent<SupportTableProps> = ({ voters }) => {
  return (
    <table className="table table-compact w-full bg-inherit">
      <thead>
        <tr className="bg-inherit border-accent border-opacity-[40%]">
          <th className="pl-0">Address</th>
          <th>Votes</th>
        </tr>
      </thead>
      <tbody>
        {voters.map((voter) => {
          let votesBn;
          try {
            votesBn = BigNumber.from(voter.votes);
          } catch (e) {
            return (
              <tr key={voter.address} className="bg-inherit">
                <td className="pl-0 bg-inherit border-accent border-opacity-[40%]">
                  <Address address={voter.address} />
                </td>
                <td className="bg-inherit border-accent border-opacity-[40%]">
                  -
                </td>
              </tr>
            );
          }

          return (
            <tr key={voter.address} className="bg-inherit">
              <td className="pl-0 bg-inherit border-accent border-opacity-[40%]">
                <Address address={voter.address} />
              </td>
              <td className="bg-inherit border-accent border-opacity-[40%]">
                <TokenAmount amount={ethers.utils.formatUnits(votesBn)} />
              </td>
            </tr>
          );
        })}

        {voters.length < 1 && (
          <tr className="bg-inherit">
            <td className="pl-0 bg-inherit border-accent border-opacity-[40%]">
              -
            </td>
            <td className="bg-inherit border-accent border-opacity-[40%]">-</td>
          </tr>
        )}
      </tbody>
    </table>
  );
};

export { SupportTable };
