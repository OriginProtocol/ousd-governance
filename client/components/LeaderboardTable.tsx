export const LeaderboardTable = ({ limit }: { limit: number }) => {
  const leaderboard = Array(limit).fill({
    address: "0x0000000000000000000000000000000000000000",
    votes: 100,
  });

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
        {leaderboard.map((item, index) => (
          <tr>
            <td>{index}</td>
            <td>{item.address}</td>
            <td>{item.votes}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
