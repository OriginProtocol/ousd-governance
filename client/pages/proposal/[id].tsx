import type { NextPage } from "next";
import { useRouter } from "next/router";

import { ProposalDetail } from "@/components/proposal/ProposalDetail";

const ProposalPage: NextPage = () => {
  const router = useRouter();

  const proposalId = router.query.id;

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Proposal {proposalId}
        </h1>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <ProposalDetail proposalId={proposalId} />
      </div>
    </>
  );
};

export default ProposalPage;
