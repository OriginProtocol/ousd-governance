import type { NextPage } from "next";
import { PageTitle } from "components/PageTitle";
import { LeaderboardTable } from "components/LeaderboardTable";
import prisma from "lib/prisma";

export async function getServerSideProps({ res }: { res: any }) {
  const voters = (
    await prisma.voter.findMany({ orderBy: [{ votes: "desc" }] })
  ).map((v) => ({
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
