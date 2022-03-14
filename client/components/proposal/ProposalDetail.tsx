import { useState, useEffect } from "react";
import { Loading } from "components/Loading";
import { ProposalActionsTable } from "components/proposal/ProposalActionsTable";
import { ProposalVoteStats } from "components/proposal/ProposalVoteStats";
import { ProposalParameters } from "components/proposal/ProposalParameters";
import { governanceContract } from "constants/index";
import { SectionTitle } from "components/SectionTitle";

export const ProposalDetail = ({ proposalId }) => {
  const [proposalActions, setProposalActions] = useState(null);
  const [proposal, setProposal] = useState(null);
  const [proposalState, setProposalState] = useState(null);

  useEffect(() => {
    const loadProposal = async () => {
      setProposalActions(await governanceContract.getActions(proposalId));
      setProposal(await governanceContract.proposals(proposalId));
      setProposalState(await governanceContract.state(proposalId));
    };
    if (proposalId) {
      loadProposal();
    }
  }, [proposalId]);

  if (proposal === null || proposalActions === null) return <Loading />;

  return (
    <>
      <ProposalVoteStats proposal={proposal} />
      <SectionTitle>Proposal Parameters</SectionTitle>
      <ProposalParameters proposal={proposal} state={proposalState} />
      <SectionTitle>Governance Actions</SectionTitle>
      <ProposalActionsTable proposalActions={proposalActions} />
      <SectionTitle>Justification</SectionTitle>
    </>
  );
};
