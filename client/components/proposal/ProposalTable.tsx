import { useRouter } from "next/router";
import { Loading } from "components/Loading";
import { StateTag } from "components/proposal/StateTag";

export const ProposalTable = ({ proposalData }) => {
  const router = useRouter();

  if (!proposalData || proposalData?.loading) return <Loading />;

  if (proposalData.proposals.length === 0) {
    return (
      <div className="text-center pt-5">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          No proposals have been created
        </h3>
        <div className="mt-6">
          <a href="/proposal/new" className="btn btn-primary btn-sm">
            <svg
              className="-ml-1 mr-2 h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              />
            </svg>
            Create Proposal
          </a>
        </div>
      </div>
    );
  }

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
            <td>{proposal.displayId}</td>
            <td>{proposal[1]}</td>
            <td>
              <StateTag state={proposalData.states[index]} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
