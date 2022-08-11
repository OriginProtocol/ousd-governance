import { ethers } from "ethers";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Loading } from "components/Loading";
import { ProposalActionsTable } from "components/proposal/ProposalActionsTable";
import { ProposalVoteStats } from "components/proposal/ProposalVoteStats";
import { ProposalParameters } from "components/proposal/ProposalParameters";
import { SectionTitle } from "components/SectionTitle";
import CardGroup from "components/CardGroup";
import Card from "components/Card";
import { useStore } from "utils/store";
import { toast } from "react-toastify";
import useShowDelegationModalOption from "utils/useShowDelegationModalOption";
import { EnsureDelegationModal } from "components/proposal/EnsureDelegationModal";
import { PageTitle } from "components/PageTitle";
import { getProposalContent } from "utils/index";
import { Address } from "components/Address";

export const ProposalDetail = ({
  proposalId,
  description,
}: {
  proposalId: string;
  description: string;
}) => {
  const { address, contracts, pendingTransactions } = useStore();
  const [proposalActions, setProposalActions] = useState(null);
  const { showModalIfApplicable } = useShowDelegationModalOption();
  const [proposal, setProposal] = useState(null);
  const [proposalState, setProposalState] = useState(null);
  const [quorum, setQuorum] = useState(0);
  const [reloadProposal, setReloadProposal] = useState(false);
  const [votePower, setVotePower] = useState(ethers.BigNumber.from(0));
  const [hasVoted, setHasVoted] = useState(false);
  const { Governance } = contracts;
  const { title: proposalTitle, description: proposalDescription } =
    getProposalContent(description);

  useEffect(() => {
    const loadProposal = async () => {
      setProposalActions(await Governance.getActions(proposalId));
      setProposal(await Governance.proposals(proposalId));
      setProposalState(await Governance.state(proposalId));
    };
    if (proposalId && Governance) {
      loadProposal();
    }
  }, [proposalId, Governance, reloadProposal]);

  useEffect(() => {
    const loadVotePower = async () => {
      setVotePower(await Governance.getVotes(address, proposal.startBlock));
    };
    if (address && proposal && Governance) {
      loadVotePower();
    }
  }, [address, proposal, Governance]);

  useEffect(() => {
    const loadHasVoted = async () => {
      setHasVoted(await Governance.hasVoted(proposalId, address));
    };
    if (address && proposal && Governance) {
      loadHasVoted();
    }
  }, [address, proposal, Governance, proposalId, reloadProposal]);

  useEffect(() => {
    const loadQuorum = async () => {
      setQuorum(await Governance.quorum(proposal.startBlock));
    };
    if (proposal && Governance) {
      loadQuorum();
    }
  }, [proposal, Governance, proposalId, reloadProposal]);

  if (proposal === null || proposalActions === null) return <Loading />;

  const handleVote = async (support: Number) => {
    // showing delegation modal quits flow
    if (showModalIfApplicable()) {
      return;
    }

    const transaction = await Governance.castVote(proposalId, support);

    useStore.setState({
      pendingTransactions: [
        ...pendingTransactions,
        {
          ...transaction,
          onComplete: () => {
            toast.success("Vote has been submitted", {
              hideProgressBar: true,
            });
            setReloadProposal(!reloadProposal);
          },
        },
      ],
    });
  };

  return (
    <>
      <div className="flex justify-between mb-4">
        <PageTitle>{proposalTitle}</PageTitle>
        <div className="flex-shrink-0 space-y-1">
          <div className="ml-4 bg-white bg-opacity-10 text-white px-2 py-1 rounded-sm">
            <Address address={proposal?.proposer} />
          </div>
        </div>
      </div>
      <CardGroup>
        <ProposalVoteStats
          proposal={proposal}
          votePower={votePower}
          onVote={handleVote}
          hasVoted={hasVoted}
        />
        <Card>
          <div className="space-y-8">
            <div>
              <SectionTitle>Proposal Parameters</SectionTitle>
              <ProposalParameters
                proposal={proposal}
                state={proposalState}
                quorum={quorum}
              />
            </div>
            <div>
              <SectionTitle>Governance Actions</SectionTitle>
              <ProposalActionsTable proposalActions={proposalActions} />
              {description && (
                <>
                  <SectionTitle>Signalling Proposal</SectionTitle>
                  <Link
                    href={`https://vote.originprotocol.com/#/proposal/${description}`}
                    passHref
                  >
                    <a target="_blank">{description}</a>
                  </Link>
                </>
              )}
            </div>
          </div>
        </Card>
      </CardGroup>
      <EnsureDelegationModal />
    </>
  );
};
