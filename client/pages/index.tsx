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
    await prisma.voter.findMany({ orderBy: [{ votes: "desc" }], take: 5 })
  ).map((v) => ({
    address: v.address,
    votes: v.votes.toHexadecimal(),
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

const Home: NextPage = ({
  voters,
  proposals,
  proposalCount,
  holderCount,
}: {
  voters: Array<{ address: string; votes: string }>;
  proposals: Array<{
    id: number;
    proposalId: string;
    updatedAt: string;
    createdAt: string;
  }>;
  proposalCount: number;
  holderCount: number;
}) => {
  const { contracts } = useStore();
  const networkInfo = useNetworkInfo();
  const [proposalData, setProposalData] = useState<ProposalDataType>({
    proposals: [],
    states: [],
  });
  const [totalSupply, setTotalSupply] = useState<BigNumber>(BigNumber.from(0));
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
        })),
      };
      setProposalData(dataWithDisplayId);
      setLoading(false);
    };

    if (networkInfo.correct && contracts.Governance) {
      load();
    }
  }, [proposals, setProposalData, contracts.Governance, networkInfo.correct]);

  useEffect(() => {
    const loadTotalSupply = async () => {
      const totalSupply = await contracts.VoteLockerCurve.totalSupply();
      setTotalSupply(totalSupply);
    };

    if (networkInfo.correct && contracts.VoteLockerCurve) {
      loadTotalSupply();
    }
  }, [contracts, networkInfo.correct]);

  return (
    <Wrapper narrow>
      <Seo />
      <PageTitle>Overview</PageTitle>
      <CardGroup>
        <VoteStats
          proposalCount={proposalCount}
          holderCount={holderCount}
          totalSupply={totalSupply}
        />
        <Card>
          <SectionTitle>Last 5 Proposals</SectionTitle>
          {loading ? (
            <Loading />
          ) : (
            <ProposalTable proposalData={proposalData} />
          )}
        </Card>
        <Card>
          <SectionTitle>Top 5 Voters</SectionTitle>
          <LeaderboardTable voters={voters} />
        </Card>
      </CardGroup>
    </Wrapper>
  );
};

export default Home;
