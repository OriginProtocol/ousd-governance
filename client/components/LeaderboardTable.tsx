import { ethers } from "ethers";
import TokenAmount from "components/TokenAmount";
import { useStore } from "utils/store";
import { Address } from "components/Address";

export const LeaderboardTable = ({ voters }: { voters: Array }) => {
  const { totalBalances } = useStore();
  const { totalSupplyVeOgv } = totalBalances;

  if (voters.length < 1) {
    return <p className="text-gray-500 text-sm">No voters yet.</p>;
  }

  return (
    <table className="table w-full">
      <thead>
        <tr className="bg-inherit border-accent border-opacity-[40%]">
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
            <td className="bg-inherit border-accent border-opacity-[40%]">
              {index + 1}
            </td>
            <td className="bg-inherit border-accent border-opacity-[40%]">
              <Address address={voter.address} />
            </td>
            <td className="bg-inherit border-accent border-opacity-[40%]">
              <TokenAmount
                amount={ethers.utils.formatUnits(
                  ethers.BigNumber.from(voter.votes)
                )}
              />
            </td>
            <td className="bg-inherit border-accent border-opacity-[40%]">
              {((voter.votes / totalSupplyVeOgv) * 100).toFixed(2)}%
            </td>
            <td className="bg-inherit border-accent border-opacity-[40%]">
              {voter.proposalsVoted}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
