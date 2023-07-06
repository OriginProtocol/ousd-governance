import { useRouter } from "next/router";
import { FunctionComponent } from "react";
import { Loading } from "components/Loading";
import { StateTag } from "components/proposal/StateTag";
import { getCleanProposalContent } from "utils/index";
import moment from "moment";
import { SectionTitle } from "components/SectionTitle";
import RegisterToVote from "components/proposal/RegisterToVote";

interface ProposalTableProps {
  proposalData: Array<object>;
  title?: string;
}

const ProposalTable: FunctionComponent<ProposalTableProps> = ({
  proposalData,
  title,
}) => {
  const router = useRouter();

  if (!proposalData || proposalData?.loading) return <Loading />;

  if (proposalData.proposals.length === 0) {
    return (
      <>
        <RegisterToVote />
        {title && <SectionTitle>{title}</SectionTitle>}
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
        </div>
      </>
    );
  }

  return (
    <>
      <RegisterToVote />
      {title && <SectionTitle>{title}</SectionTitle>}
      <div className="overflow-x-auto px-8 py-4 bg-secondary-content rounded-lg">
        <table className="table table-fixed w-full">
          <tbody>
            {proposalData.proposals?.map((proposal, index) => {
              const { cleanTitle } = getCleanProposalContent(
                proposal.description
              );
              const id = proposal.displayId?.toString().padStart(3, "0");
              const lastTx =
                proposal.transactions?.[proposal.transactions?.length - 1];

              return (
                <tr
                  key={index}
                  className="cursor-pointer bg-inherit border-accent border-opacity-[40%]"
                  onClick={() => router.push(`/proposals/${proposal["0"]}`)}
                >
                  <td className="bg-inherit border-none px-0 py-8">
                    <div className="space-y-2">
                      <h3
                        className="text-white truncate"
                        dangerouslySetInnerHTML={{ __html: cleanTitle }}
                      />
                      <div className="text-neutral text-xs">
                        {id} •{" "}
                        {lastTx &&
                          `${lastTx?.event} ${moment(lastTx?.createdAt).format(
                            "MMM D, YYYY"
                          )}`}
                      </div>
                    </div>
                  </td>
                  <td className="bg-inherit border-none w-1/4 text-right">
                    <StateTag state={proposalData.states[index]} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
};

export { ProposalTable };
