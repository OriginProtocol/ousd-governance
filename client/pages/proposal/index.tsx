import { useState, useEffect } from "react";
import type { NextPage } from "next";
import { useRouter } from "next/router";
import { loadProposals } from "utils/index";
import { useStore } from "utils/store";
import type { ProposalDataType } from "pages/index";
import { Loading } from "components/Loading";
import { ProposalTable } from "components/proposal/ProposalTable";
import { PageTitle } from "components/PageTitle";
import prisma from "lib/prisma";

export async function getServerSideProps({ res }: { res: any }) {
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=60, stale-while-revalidate=59"
  );

  const proposalCount = await prisma.proposal.count();
  const proposals = (
    await prisma.proposal.findMany({ orderBy: { createdAt: "desc" } })
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
    load();
  }, [proposals, setProposalData, contracts.Governance]);

  return (
    <>
      <PageTitle>Proposals</PageTitle>
      {proposals.length > 0 && (
        <button
          className="btn btn-primary mb-5"
          onClick={() => router.push("/proposal/new")}
        >
          New Proposal
        </button>
      )}
      {loading ? <Loading /> : <ProposalTable proposalData={proposalData} />}
    </>
  );
};

export default Proposal;
