import type { NextPage } from "next";

import { ProposalList } from "@/components/proposal/ProposalList";

const Proposal: NextPage = () => {
  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Proposals</h1>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <ProposalList />
      </div>
    </>
  );
};

export default Proposal;
