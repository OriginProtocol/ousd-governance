import type { NextPage } from "next";
import { useRouter } from "next/router";
import { ProposalDetail } from "components/proposal/ProposalDetail";
import { PageTitle } from "components/PageTitle";

const ProposalPage: NextPage = () => {
  const router = useRouter();

  const proposalId = router.query.id;

  return (
    <>
      <PageTitle>Proposal</PageTitle>
      <ProposalDetail proposalId={proposalId} />
    </>
  );
};

export default ProposalPage;
