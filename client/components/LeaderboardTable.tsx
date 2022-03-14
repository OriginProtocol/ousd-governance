import { ethers } from "ethers";

export const LeaderboardTable = ({ voters }: { voters: Array }) => {
  return (
    <table className="table table-zebra table-compact w-full">
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
            <td>{index}</td>
            <td>{voter.address}</td>
            <td>
              {ethers.utils.formatUnits(ethers.BigNumber.from(voter.votes))}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
