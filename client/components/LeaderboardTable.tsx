import { ethers } from "ethers";
import TokenAmount from "components/TokenAmount";
import { truncateEthAddress } from "utils";
import { useStore } from "utils/store";

export const LeaderboardTable = ({ voters }: { voters: Array }) => {
  const { totalBalances } = useStore();
  const { totalSupplyVeOgv } = totalBalances;

  if (voters.length < 1) {
    return <p className="text-gray-500 text-sm">No voters yet.</p>;
  }

  return (
    <table className="table w-full">
      <thead>
        <tr>
          <th>Rank</th>
          <th>Address</th>
          <th>Votes</th>
          <th>Vote Weight</th>
          <th>Proposals Voted</th>
        </tr>
      </thead>
      <tbody>
        {voters.map((voter, index) => (
          <tr key={index}>
            <td>{index + 1}</td>
            <td>{truncateEthAddress(voter.address)}</td>
            <td>
              <TokenAmount
                amount={ethers.utils.formatUnits(
                  ethers.BigNumber.from(voter.votes)
                )}
              />
            </td>
            <td>{(voter.votes / totalSupplyVeOgv) * 100}%</td>
            <td></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
