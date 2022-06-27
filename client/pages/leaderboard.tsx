import type { NextPage } from "next";
import { PageTitle } from "components/PageTitle";
import { LeaderboardTable } from "components/LeaderboardTable";
import Card from "components/Card";
import prisma from "lib/prisma";
import Wrapper from "components/Wrapper";

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
    <Wrapper narrow>
      <PageTitle>Leaderboard</PageTitle>
      <Card>
        <LeaderboardTable voters={voters} />
      </Card>
    </Wrapper>
  );
};

export default Leaderboard;
