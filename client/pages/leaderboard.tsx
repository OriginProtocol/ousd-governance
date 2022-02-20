import type { NextPage } from "next";
import { PageTitle } from "components/PageTitle";
import { LeaderboardTable } from "components/LeaderboardTable";

const Leaderboard: NextPage = () => {
  return (
    <>
      <PageTitle>Leaderboard</PageTitle>
      <LeaderboardTable limit={100} />
    </>
  );
};

export default Leaderboard;
