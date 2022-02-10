import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Loading } from "components/Loading";
import { governanceContract } from "constants/index";

export const ProposalTable = () => {
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
          <tr
            className="hover cursor-pointer"
            onClick={() => router.push(`/proposal/${proposal.id}`)}
          >
            <td>{proposal[0].toString()}</td>
            <td>{proposal[1]} </td>
            <td>
              {proposalData.states[index] == 0 && (
                <div className="badge badge-info">Pending</div>
              )}
              {proposalData.states[index] == 1 && (
                <div className="badge badge-warning">Queued</div>
              )}
              {proposalData.states[index] == 2 && (
                <div className="badge badge-error">Expired</div>
              )}
              {proposalData.states[index] == 3 && (
                <div className="badge badge-success">Executed</div>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
