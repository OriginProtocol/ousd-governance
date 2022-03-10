import { useState, useEffect } from "react";
import type { NextPage } from "next";
import { useRouter } from "next/router";
import { loadProposals } from "utils/index";
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

  const proposals = await prisma.proposal.findMany();

  return {
    props: {
      proposals,
    },
  };
}

const Proposal: NextPage = ({ proposals }) => {
  const router = useRouter();

  const [proposalData, setProposalData] = useState<ProposalDataType>({
    count: proposals.length,
    proposals: [],
    states: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(false);
    };
    load();
  }, []);

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
