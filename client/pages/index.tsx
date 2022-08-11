import { useState, useEffect } from "react";
import { BigNumber } from "ethers";
import type { NextPage } from "next";
import { loadProposals, useNetworkInfo } from "utils/index";
import { ProposalTable } from "components/proposal/ProposalTable";
import { Loading } from "components/Loading";
import { VoteStats } from "components/VoteStats";
import { PageTitle } from "components/PageTitle";
import { SectionTitle } from "components/SectionTitle";
import { LeaderboardTable } from "components/LeaderboardTable";
import Card from "components/Card";
import CardGroup from "components/CardGroup";
import Wrapper from "components/Wrapper";
import prisma from "lib/prisma";
import { useStore } from "utils/store";
import Seo from "components/Seo";
import Link from "components/Link";

export type ProposalDataType = {
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
  const voters = (
    await prisma.voter.findMany({
      include: { proposalsVoted: true },
      orderBy: [{ votes: "desc" }],
      take: 5,
    })
  ).map((v) => ({
    address: v.address,
    votes: v.votes.toHexadecimal(),
    proposalsVoted: v?.proposalsVoted?.length,
  }));

  const proposalCount = await prisma.proposal.count();
  const proposals = (
    await prisma.proposal.findMany({
      orderBy: [{ id: "desc" }],
      take: 5,
    })
  ).map((p) => ({
    id: p.id,
    proposalId: p.proposalId,
    createdAt: p.createdAt.toString(),
    description: p.description,
  }));

  return {
    props: {
      voters,
      proposals,
      proposalCount,
      holderCount,
    },
  };
}

interface HomeProps {
  voters: Array<{ address: string; votes: string }>;
  proposals: Array<{
    id: number;
    proposalId: string;
    updatedAt: string;
    createdAt: string;
  }>;
  proposalCount: number;
  holderCount: number;
}

const Home: NextPage<HomeProps> = ({
  voters,
  proposals,
  proposalCount,
  holderCount,
}) => {
  const { contracts, totalBalances } = useStore();
  const { totalSupplyVeOgv } = totalBalances;

  const networkInfo = useNetworkInfo();
  const [proposalData, setProposalData] = useState<ProposalDataType>({
    proposals: [],
    states: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const data = await loadProposals(
        contracts.Governance,
        proposals.map((p) => p.proposalId)
      );
      // Augment with human readable ID from the database
      const dataWithDisplayId = {
        ...data,
        proposals: data.proposals.map((d) => ({
          ...d,
          displayId: proposals.find(
            (p) => p.proposalId.toString() === d.id.toString()
          )?.id,
          description: proposals.find(
            (p) => p.proposalId.toString() === d.id.toString()
          )?.description,
        })),
      };
      setProposalData(dataWithDisplayId);
      setLoading(false);
    };

    if (contracts.Governance) {
      load();
    }
  }, [proposals, setProposalData, contracts.Governance, networkInfo.correct]);

  return (
    <Wrapper narrow>
      <Seo />
      <PageTitle>Governance Overview</PageTitle>
      <CardGroup>
        <VoteStats
          proposalCount={proposalCount}
          holderCount={holderCount}
          totalSupply={totalSupplyVeOgv}
        />
        <Card>
          <SectionTitle>Recent Proposals</SectionTitle>
          {loading ? (
            <Loading />
          ) : (
            <div className="space-y-4">
              <ProposalTable proposalData={proposalData} />
              {proposalCount > 0 && (
                <Link
                  href="/proposals"
                  className="btn rounded-full normal-case space-x-2 w-full btn-primary btn-outline disabled:border-gray-100 disabled:text-gray-300"
                >
                  View All Proposals
                </Link>
              )}
            </div>
          )}
        </Card>
        <Card>
          <SectionTitle>Top Voting Addresses</SectionTitle>
          <div className="space-y-4">
            <LeaderboardTable voters={voters} />
            {voters && voters.length > 0 && (
              <Link
                href="/leaderboard"
                className="btn rounded-full normal-case space-x-2 w-full btn-primary btn-outline disabled:border-gray-100 disabled:text-gray-300"
              >
                View Leaderboard
              </Link>
            )}
          </div>
        </Card>
      </CardGroup>
    </Wrapper>
  );
};

export default Home;
