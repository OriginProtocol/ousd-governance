import { ethers } from "ethers";
import { useState, useEffect } from "react";
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
import { SupportTable } from "./SupportTable";
import { StateTag } from "./StateTag";

export const ProposalDetail = ({
  id,
  proposalId,
  createdAt,
  description,
  voters,
}: {
  id: string;
  proposalId: string;
  createdAt: string;
  description: string;
  voters: Array<object>;
}) => {
  const { address, contracts, pendingTransactions, rpcProvider } = useStore();
  const [proposalActions, setProposalActions] = useState(null);
  const { showModalIfApplicable } = useShowDelegationModalOption();
  const [proposal, setProposal] = useState(null);
  const [proposalState, setProposalState] = useState(null);
  const [quorum, setQuorum] = useState(0);
  const [reloadProposal, setReloadProposal] = useState(false);
  const [votePower, setVotePower] = useState(ethers.BigNumber.from(0));
  const [hasVoted, setHasVoted] = useState(false);
  const [forVoters, setForVoters] = useState([]);
  const [againstVoters, setAgainstVoters] = useState([]);
  const [blockNumber, setBlockNumber] = useState(0);
  const { Governance } = contracts;
  const { title: proposalTitle, description: proposalDescription } =
    getProposalContent(description);

  useEffect(() => {
    const getBlockNumber = async () => {
      const blockNumber = await rpcProvider.getBlockNumber();
      setBlockNumber(parseInt(blockNumber));
    };
    if (rpcProvider) {
      getBlockNumber();
    }
  }, [rpcProvider]);

  useEffect(() => {
    const loadVoters = async () => {
      const receipts = await Promise.all(
        voters.map((voter) => Governance.getReceipt(proposalId, voter.address))
      );

      const enrichedVoters = voters.map((voter, index) => {
        return {
          ...voter,
          votes: receipts[index].votes,
          support: receipts[index].support,
        };
      });

      setForVoters(enrichedVoters.filter((voter) => voter.support === 1));
      setAgainstVoters(enrichedVoters.filter((voter) => voter.support === 0));
    };

    if (voters && Governance) {
      loadVoters();
    }
  }, [proposalId, Governance, voters]);

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
    if (proposal && Governance && blockNumber > parseInt(proposal.startBlock)) {
      loadQuorum();
    }
  }, [proposal, Governance, proposalId, reloadProposal, blockNumber]);

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
      <div className="flex justify-between items-center mb-6">
        <div className="mr-4">
          <PageTitle noBottomMargin>
            <div dangerouslySetInnerHTML={{ __html: proposalTitle }} />
          </PageTitle>
          <div className="text-white opacity-70 text-md">
            {id.toString().padStart(3, "0")} • Created {createdAt} • By{" "}
            <Address address={proposal.proposer} />
          </div>
        </div>
        <StateTag state={proposalState} />
      </div>
      <CardGroup>
        <ProposalVoteStats
          proposal={proposal}
          votePower={votePower}
          onVote={handleVote}
          hasVoted={hasVoted}
        />
        {(forVoters.length > 0 || againstVoters.length > 0) && (
          <CardGroup
            twoCol={forVoters.length > 0 && againstVoters.length > 0}
            horizontal={forVoters.length > 0 && againstVoters.length > 0}
          >
            {forVoters.length > 0 && (
              <Card
                tightPadding={forVoters.length > 0 && againstVoters.length > 0}
              >
                <SectionTitle>For Voters</SectionTitle>
                <SupportTable voters={forVoters} />
              </Card>
            )}
            {againstVoters.length > 0 && (
              <Card
                tightPadding={forVoters.length > 0 && againstVoters.length > 0}
              >
                <SectionTitle>Against Voters</SectionTitle>
                <SupportTable voters={againstVoters} />
              </Card>
            )}
          </CardGroup>
        )}
        <CardGroup>
          <Card>
            <div className="space-y-8">
              {description && (
                <div>
                  <SectionTitle>Description</SectionTitle>
                  <div
                    className="text-sm"
                    dangerouslySetInnerHTML={{ __html: proposalDescription }}
                  />
                </div>
              )}
              <div>
                <SectionTitle>Actions</SectionTitle>
                <ProposalActionsTable proposalActions={proposalActions} />
              </div>
            </div>
          </Card>
        </CardGroup>
        <Card>
          <div className="space-y-8">
            <div>
              <SectionTitle>Details</SectionTitle>
              <ProposalParameters
                proposal={proposal}
                state={proposalState}
                quorum={quorum}
              />
            </div>
          </div>
        </Card>
      </CardGroup>
      <EnsureDelegationModal />
    </>
  );
};
