import { useState, useEffect } from "react";
import type { NextPage } from "next";
import { useRouter } from "next/router";
import { loadProposals } from "utils/index";
import type { ProposalDataType } from "pages/index";
import { Loading } from "components/Loading";
import { ProposalTable } from "components/proposal/ProposalTable";
import { PageTitle } from "components/PageTitle";

const Proposal: NextPage = () => {
  const router = useRouter();

  const [proposalData, setProposalData] = useState<ProposalDataType>() || [
    { count: 0, proposals: [], states: [] },
  ];
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const data = await loadProposals();
      setProposalData(data);
      setLoading(false);
    };
    load();
  }, [setProposalData]);

  return (
    <>
      <PageTitle>Proposals</PageTitle>
      <button
        className="btn btn-primary mb-5"
        onClick={() => router.push("/proposal/new")}
      >
        New Proposal
      </button>
      {loading ? <Loading /> : <ProposalTable proposalData={proposalData} />}
    </>
  );
};

export default Proposal;
