import type { NextPage } from "next";
import { useRouter } from "next/router";

import { ProposalTable } from "@/components/proposal/ProposalTable";

const Proposal: NextPage = () => {
  const router = useRouter();

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Proposals</h1>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="mb-5">
          <button
            className="btn btn-primary"
            onClick={() => router.push("/proposal/new")}
          >
            New Proposal
          </button>
        </div>

        <ProposalTable />
      </div>
    </>
  );
};

export default Proposal;
