import { useRouter } from "next/router";
import { FunctionComponent, useState } from "react";
import { Loading } from "components/Loading";
import { StateTag } from "components/proposal/StateTag";
import { getCleanProposalContent } from "utils/index";
import moment from "moment";
import Button from "components/Button";
import { SectionTitle } from "components/SectionTitle";
import { useStore } from "utils/store";
import useShowDelegationModalOption from "utils/useShowDelegationModalOption";
import { toast } from "react-toastify";

interface ProposalTableProps {
  proposalData: Array<object>;
  title?: string;
}

const ProposalTable: FunctionComponent<ProposalTableProps> = ({
  proposalData,
  title,
}) => {
  const router = useRouter();
  const { contracts, address, balances, pendingTransactions } = useStore();
  const { veOgv } = balances;
  const [registerStatus, setRegisterStatus] = useState("ready");
  const { needToShowDelegation } = useShowDelegationModalOption();

  if (!proposalData || proposalData?.loading) return <Loading />;

  const RegisterToVote = () => (
    <div className="mb-20">
      <div className="bg-accent text-white -my-10 -mx-6 p-10 md:-mx-10">
        <h2 className="text-lg font-bold mb-2">Governance Information</h2>
        <p className="mb-4">
          Please register to participate in governance for future proposals. You
          won&apos;t be able to vote on a proposal with your veOGV until you do.
        </p>
        <Button
          white
          large
          onClick={handleRegistration}
          disabled={registerStatus !== "ready"}
        >
          {registerButtonText}
        </Button>
      </div>
    </div>
  );

  let registerButtonText = "";
  if (registerStatus === "ready") {
    registerButtonText = "Register to Vote";
  } else if (registerStatus === "waiting-for-user") {
    registerButtonText = "Confirm transaction";
  } else if (registerStatus === "waiting-for-network") {
    registerButtonText = "Waiting to be mined";
  }

  const handleRegistration = async () => {
    setRegisterStatus("waiting-for-user");
    try {
      const transaction = await contracts.OgvStaking.delegate(address);
      setRegisterStatus("waiting-for-network");
      //await rpcProvider.waitForTransaction(transaction.hash);

      useStore.setState({
        pendingTransactions: [
          ...pendingTransactions,
          {
            ...transaction,
            onComplete: () => {
              toast.success("You've registered to vote", {
                hideProgressBar: true,
              }),
                setRegisterStatus("ready");
              useStore.setState({ ogvDelegateeAddress: address });
            },
          },
        ],
      });
    } catch (e) {
      setRegisterStatus("ready");
    }
  };

  const hasTokensButUnregistered = veOgv.gt(0) && needToShowDelegation;

  if (proposalData.proposals.length === 0) {
    return (
      <>
        {hasTokensButUnregistered && <RegisterToVote />}
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
      {hasTokensButUnregistered && <RegisterToVote />}
      {title && <SectionTitle>{title}</SectionTitle>}
      <div className="overflow-x-auto">
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
                  className="cursor-pointer hover:bg-gray-100"
                  onClick={() => router.push(`/proposals/${proposal["0"]}`)}
                >
                  <td>
                    <div className="space-y-1">
                      <h3 className="text-lg truncate">
                        <div dangerouslySetInnerHTML={{ __html: cleanTitle }} />
                      </h3>
                      <div className="text-gray-400 text-md">
                        {id} •{" "}
                        {lastTx &&
                          `${lastTx?.event} ${moment(lastTx?.createdAt).format(
                            "MMM D, YYYY"
                          )}`}
                      </div>
                    </div>
                  </td>
                  <td className="w-1/4 text-right">
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
