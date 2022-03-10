import type { NextPage } from "next";
import { PageTitle } from "components/PageTitle";
import { LeaderboardTable } from "components/LeaderboardTable";

export async function getServerSideProps({ res }: { res: any }) {
  const voters = (await prisma.voter.findMany()).map((v) => ({
    address: v.address,
    votes: v.votes.toString(),
  }));

  return {
    props: {
      voters,
    },
  };
}

const Leaderboard: NextPage = ({ voters }) => {
  return (
    <>
      <PageTitle>Leaderboard</PageTitle>
      <LeaderboardTable voters={voters} />
    </>
  );
};

export default Leaderboard;
