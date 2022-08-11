import type { NextPage } from "next";
import { PageTitle } from "components/PageTitle";
import { LeaderboardTable } from "components/LeaderboardTable";
import Card from "components/Card";
import prisma from "lib/prisma";
import Wrapper from "components/Wrapper";
import Seo from "components/Seo";

export async function getServerSideProps({ res }: { res: any }) {
  const voters = (
    await prisma.voter.findMany({
      include: { proposalsVoted: true },
      orderBy: [{ votes: "desc" }],
    })
  ).map((v) => ({
    address: v.address,
    votes: v.votes.toHexadecimal(),
    proposalsVoted: v?.proposalsVoted?.length,
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
      <Seo title="Leaderboard" />
      <PageTitle>Leaderboard</PageTitle>
      <Card>
        <LeaderboardTable voters={voters} />
      </Card>
    </Wrapper>
  );
};

export default Leaderboard;
