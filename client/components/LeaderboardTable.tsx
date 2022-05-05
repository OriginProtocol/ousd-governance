import { ethers } from "ethers";
import { Address } from "components/Address";

export const LeaderboardTable = ({ voters }: { voters: Array }) => {
  if (voters.length < 1) {
    return <p className="text-gray-500 text-sm">No voters yet.</p>;
  }

  return (
    <table className="table w-full">
      <thead>
        <tr>
          <th>#</th>
          <th>Address</th>
          <th>Votes</th>
        </tr>
      </thead>
      <tbody>
        {voters.map((voter, index) => (
          <tr key={index}>
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
