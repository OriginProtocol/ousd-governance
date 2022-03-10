import { useState, useEffect } from "react";
import { BigNumber } from "ethers";
import type { NextPage } from "next";
import { governanceTokenAddress } from "constants/index";
import { loadProposals } from "utils/index";
import { ProposalTable } from "components/proposal/ProposalTable";
import { Loading } from "components/Loading";
import { VoteStats } from "components/VoteStats";
import { PageTitle } from "components/PageTitle";
import { SectionTitle } from "components/SectionTitle";
import { LeaderboardTable } from "components/LeaderboardTable";
import prisma from "lib/prisma";

export type ProposalDataType = {
  count: BigNumber;
  proposals: Array<Array<[BigNumber, string, BigNumber, boolean]>>;
  states: Array<number>;
};

export async function getServerSideProps({ res }: { res: any }) {
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=60, stale-while-revalidate=59"
  );

  const holderCount = await prisma.voter.count();
  // Limit 5
  const voters = (await prisma.voter.findMany()).map((v) => ({
    address: v.address,
    votes: v.votes.toString(),
  }));

  const proposalCount = await prisma.proposal.count();

  return {
    props: {
      voters,
      proposalCount,
      holderCount,
      totalSupply: 10,
    },
  };
}

const Home: NextPage = ({
  voters,
  proposalCount,
  holderCount,
  totalSupply,
}: {
  voters: Array<{ address: string; votes: string }>;
  proposalCount: number;
  holderCount: number;
  totalSupply: number;
}) => {
  const [proposalData, setProposalData] = useState<ProposalDataType>({
    count: BigNumber.from(0),
    proposals: [],
    states: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      // const data = await loadProposals();
      // setProposalData(data);
      setLoading(false);
    };
    load();
  }, [setProposalData]);

  return (
    <div>
      <PageTitle>Governance Overview</PageTitle>
      <VoteStats
        proposalCount={proposalCount}
        holderCount={holderCount}
        totalSupply={totalSupply}
      />
      <SectionTitle>Last 5 Proposals</SectionTitle>
      {loading ? (
        <Loading />
      ) : (
        <ProposalTable
          proposalData={{
            ...proposalData,
            proposals: proposalData?.proposals.slice(-5).reverse(),
            states: proposalData?.states.slice(-5).reverse(),
          }}
        />
      )}
      <SectionTitle>Top 5 Voters</SectionTitle>
      <LeaderboardTable voters={voters} />
    </div>
  );
};

export default Home;
