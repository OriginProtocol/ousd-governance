import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { ProposalPreview } from "components/proposal/ProposalPreview";
import { Loading } from "components/Loading";
import { governanceContract } from "/constants";

export const ProposalList = () => {
  const router = useRouter();
  const [proposalData, setProposalData] = useState({
    loading: true,
    count: 0,
    proposals: [],
    states: [],
  });

  useEffect(() => {
    const loadProposals = async () => {
      const count = await governanceContract.proposalCount();
      console.debug(`Found ${count.toString()} proposals`);
      const proposalGets = [];
      const proposalStateGets = [];
      for (let i = 1; i <= count; i++) {
        proposalGets.push(governanceContract.proposals(i));
        proposalStateGets.push(governanceContract.state(i));
      }
      setProposalData({
        loading: false,
        count,
        proposals: await Promise.all(proposalGets),
        states: await Promise.all(proposalStateGets),
      });
    };
    loadProposals();
  }, []);

  if (proposalData.loading) return <Loading />;

  return (
    <>
      <div className="mb-5">
        <button
          className="btn btn-primary"
          onClick={() => router.push("/proposal/new")}
        >
          New Proposal
        </button>
      </div>
      <div className="flex flex-col">
        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Proposer</th>
                    <th>State</th>
                  </tr>
                </thead>
                <tbody>
                  {proposalData.proposals.map((proposal, index) => (
                    <ProposalPreview
                      proposal={proposal}
                      state={proposalData.states[index]}
                      index={index}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
