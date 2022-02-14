import { useState, useEffect } from "react";
import { Loading } from "components/Loading";
import { ProposalActionsTable } from "components/proposal/ProposalActionsTable";
import { ProposalVoteStats } from "components/proposal/ProposalVoteStats";
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
      <ProposalVoteStats />
      <SectionTitle>Governance Actions</SectionTitle>
      <ProposalActionsTable proposalActions={proposalActions} />
      <SectionTitle>Justification</SectionTitle>
    </>
  );
};
