import { useState, useEffect } from "react";
import { Loading } from "components/Loading";
import { ProposalActionsTable } from "components/proposal/ProposalActionsTable";
import { ProposalVoteStats } from "components/proposal/ProposalVoteStats";
import { ProposalParameters } from "components/proposal/ProposalParameters";
import { SectionTitle } from "components/SectionTitle";
import { useStore } from "utils/store";

export const ProposalDetail = ({ proposalId }: { proposalId: string }) => {
  const { contracts } = useStore();
  const [proposalActions, setProposalActions] = useState(null);
  const [proposal, setProposal] = useState(null);
  const [proposalState, setProposalState] = useState(null);
  const { Governance } = contracts;

  useEffect(() => {
    const loadProposal = async () => {
      setProposalActions(await Governance.getActions(proposalId));
      setProposal(await Governance.proposals(proposalId));
      setProposalState(await Governance.state(proposalId));
    };
    if (proposalId) {
      loadProposal();
    }
  }, [proposalId, Governance]);

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
