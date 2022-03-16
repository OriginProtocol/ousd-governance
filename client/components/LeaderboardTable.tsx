import { ethers } from "ethers";
import { Address } from "components/Address";

export const LeaderboardTable = ({ voters }: { voters: Array }) => {
  return (
    <table className="table table-zebra w-full">
      <thead>
        <tr>
          <th>#</th>
          <th>Address</th>
          <th>Votes</th>
        </tr>
      </thead>
      <tbody>
        {voters.map((voter, index) => (
          <tr>
            <td>{index + 1}</td>
            <td>
              <Address address={voter.address} />
            </td>
            <td>
              {ethers.utils.formatUnits(ethers.BigNumber.from(voter.votes))}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
