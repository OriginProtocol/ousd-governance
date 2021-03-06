import { useState, useEffect } from "react";
import type { NextPage } from "next";
import { useRouter } from "next/router";
import { loadProposals, useNetworkInfo } from "utils/index";
import { useStore } from "utils/store";
import type { ProposalDataType } from "pages/index";
import { Loading } from "components/Loading";
import { ProposalTable } from "components/proposal/ProposalTable";
import { PageTitle } from "components/PageTitle";
import Card from "components/Card";
import Wrapper from "components/Wrapper";
import prisma from "lib/prisma";
import Seo from "components/Seo";

export async function getServerSideProps({ res }: { res: any }) {
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=60, stale-while-revalidate=59"
  );

  const proposalCount = await prisma.proposal.count();
  const proposals = (
    await prisma.proposal.findMany({ orderBy: { id: "desc" } })
  ).map((p) => ({
    id: p.id,
    proposalId: p.proposalId,
    createdAt: p.createdAt.toString(),
  }));

  return {
    props: {
      proposals,
    },
  };
}

const Proposal: NextPage = ({ proposalCount, proposals }) => {
  const { contracts } = useStore();
  const router = useRouter();
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
        })),
      };
      setProposalData(dataWithDisplayId);
      setLoading(false);
    };
    if (networkInfo.correct && contracts.loaded) {
      load();
    }
  }, [
    proposals,
    setProposalData,
    contracts.loaded,
    contracts.Governance,
    networkInfo.correct,
  ]);

  return (
    <Wrapper narrow>
      <Seo title="Proposals" />
      <div className="flex items-end justify-between">
        <PageTitle>Proposals</PageTitle>
        {proposals.length > 0 && (
          <button
            className="btn btn-primary btn-circle mb-5 text-secondary"
            onClick={() => router.push("/proposal/new")}
          >
            <span className="text-2xl block">+</span>
          </button>
        )}
      </div>
      {loading ? (
        <Loading />
      ) : (
        <Card>
          <ProposalTable proposalData={proposalData} />
        </Card>
      )}
    </Wrapper>
  );
};

export default Proposal;
