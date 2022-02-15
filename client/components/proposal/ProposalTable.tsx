import { useRouter } from "next/router";
import { Loading } from "components/Loading";

export const ProposalTable = ({ proposalData }) => {
  const router = useRouter();
  if (!proposalData || proposalData?.loading) return <Loading />;

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
        {proposalData?.proposals.map((proposal, index) => (
          <tr
            key={index}
            className="hover cursor-pointer"
            onClick={() => router.push(`/proposal/${proposal[0]}`)}
          >
            <td>{proposal[0].toString()}</td>
            <td>{proposal[1]}</td>
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
