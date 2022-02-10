import { useState, useEffect } from "react";
import { Loading } from "components/Loading";
import { ProposalActionsTable } from "components/proposal/ProposalActionsTable";
import { governanceContract } from "constants/index";
import { SectionTitle } from "components/SectionTitle";

export const ProposalDetail = ({ proposalId }) => {
  const [proposalActions, setProposalActions] = useState(null);

  useEffect(() => {
    const loadProposalActions = async () => {
      setProposalActions(await governanceContract.getActions(proposalId));
    };
    loadProposalActions();
  }, [proposalId]);

  if (proposalActions === null) return <Loading />;

  return (
    <>
      <SectionTitle>Vote</SectionTitle>

      <SectionTitle>Governance Actions</SectionTitle>

      <div className="mb-5">
        <ProposalActionsTable proposalActions={proposalActions} />
      </div>

      <SectionTitle>Justification</SectionTitle>
    </>
  );
};
