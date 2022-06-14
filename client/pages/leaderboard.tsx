import type { NextPage } from "next";
import { PageTitle } from "components/PageTitle";
import { LeaderboardTable } from "components/LeaderboardTable";
import Card from "components/Card";
import prisma from "lib/prisma";
import Layout from "components/layout";

export async function getServerSideProps({ res }: { res: any }) {
  const voters = (
    await prisma.voter.findMany({ orderBy: [{ votes: "desc" }] })
  ).map((v) => ({
    address: v.address,
    votes: v.votes.toHexadecimal(),
  }));

  return {
    props: {
      voters,
    },
  };
}

const Leaderboard: NextPage = ({ voters }) => {
  return (
    <Layout>
      <PageTitle>Leaderboard</PageTitle>
      <Card>
        <LeaderboardTable voters={voters} />
      </Card>
    </Layout>
  );
};

export default Leaderboard;
