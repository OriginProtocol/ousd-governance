import { ethers } from "ethers";
import { useState, useEffect } from "react";
import type { NextPage } from "next";
import { toast } from "react-toastify";
import Card from "components/Card";
import CardGroup from "components/CardGroup";
import { ProposalAddActionButton } from "components/proposal/ProposalAddActionButton";
import { ProposalActionAddModal } from "components/proposal/ProposalActionAddModal";
import { ProposalActionsTableEmpty } from "components/proposal/ProposalActionsTableEmpty";
import { ProposalActionsTable } from "components/proposal/ProposalActionsTable";
import { SectionTitle } from "components/SectionTitle";
import { PageTitle } from "components/PageTitle";
import { Disconnected } from "components/Disconnected";
import { Reallocation } from "components/proposal/Reallocation";
import { useStickyState } from "utils/useStickyState";
import useShowDelegationModalOption from "utils/useShowDelegationModalOption";
import { useStore } from "utils/store";
import Wrapper from "components/Wrapper";
import Seo from "components/Seo";
import { EnsureDelegationModal } from "components/proposal/EnsureDelegationModal";
import { useRouter } from "next/router";

const ProposalNew: NextPage = () => {
  const router = useRouter();
  const { address, web3Provider, contracts, pendingTransactions } = useStore();
  const { showModalIfApplicable } = useShowDelegationModalOption();
  const [votePower, setVotePower] = useState(ethers.BigNumber.from(0));
  const [proposalThreshold, setProposalThreshold] = useState<number>(0);
  const [newProposalActions, setNewProposalActions] = useStickyState(
    [],
    "proposalActions"
  );
  const [proposalDetails, setProposalDetails] = useStickyState(
    "",
    "proposalDetails"
  );

  const [isReallocation, setIsReallocation] = useStickyState(
    false,
    "isReallocation"
  );
  const [submitDisabled, setSubmitDisabled] = useState(false);

  useEffect(() => {
    const loadProposalThreshold = async () => {
      setProposalThreshold(await contracts.Governance.proposalThreshold());
    };
    if (contracts.loaded) {
      loadProposalThreshold();
    }
  }, [contracts]);

  // Load users vote power
  useEffect(() => {
    const loadVotePower = async () => {
      const votePower = await contracts.OgvStaking.balanceOf(address);
      setVotePower(votePower);
    };
    if (web3Provider && address && contracts.loaded) {
      loadVotePower();
    }
  }, [address, web3Provider, contracts]);

  const [modalOpen, setModalOpen] = useState(false);

  // Handle addition of a proposal action
  const handleAddAction = (action: string) => {
    setNewProposalActions([...newProposalActions, action]);
  };

  // Handle deletion of a proposal action
  const handleDeleteAction = (actionIndex: number) => {
    setNewProposalActions(
      newProposalActions.filter((_, index: number) => index !== actionIndex)
    );
  };

  // Reset the state of the form
  const reset = () => {
    setNewProposalActions([]);
    setProposalDetails("");
    setIsReallocation(false);
    setSubmitDisabled(false);
  };

  const proposalActions = {
    targets: newProposalActions.map((a) => a.target),
    values: newProposalActions.map((a) => 0x0),
    signatures: newProposalActions.map((a) => a.signature),
    calldatas: newProposalActions.map((a) => a.calldata),
  };

  // Handle submit of the proposal (i.e. transaction)
  const handleSubmit = async () => {
    let transaction;

    try {
      // showing delegation modal quits flow
      if (showModalIfApplicable()) {
        return;
      }
      setSubmitDisabled(true);
      transaction = await contracts.Governance[
        "propose(address[],uint256[],string[],bytes[],string)"
      ](
        proposalActions.targets,
        proposalActions.values,
        proposalActions.signatures,
        proposalActions.calldatas,
        proposalDetails.replace(/\n/g, "<br>\n")
      );
    } catch (error) {
      console.error(error);
      setSubmitDisabled(false);
      return;
    }

    useStore.setState({
      pendingTransactions: [
        ...pendingTransactions,
        {
          ...transaction,
          onComplete: () => {
            toast.success("Proposal has been submitted", {
              hideProgressBar: true,
            });
            router.push(`/proposals`);
            reset();
          },
        },
      ],
    });
  };

  if (!web3Provider) {
    return (
      <Wrapper narrow>
        <Disconnected />
      </Wrapper>
    );
  }

  /*if (votePower.lt(proposalThreshold)) {
    return (
      <Wrapper narrow>
        <Card>
          <div className="text-center">
            <p className="mt-2 font-medium">
              Minimum required vote power for a proposal is{" "}
              {proposalThreshold.toString()} votes.
              <br />
              <br />
              You have {truncateBalance(
                ethers.utils.formatUnits(votePower)
              )}{" "}
              votes.
            </p>
          </div>
        </Card>
      </Wrapper>
    );
  }*/

  return (
    <Wrapper narrow>
      <Seo title="New Proposal" />
      <PageTitle>New Proposal</PageTitle>
      <CardGroup>
        <Card>
          <SectionTitle>Proposal Details</SectionTitle>
          <label className="label">
            <span className="label-text">Title and description</span>
          </label>
          <textarea
            className="textarea textarea-bordered text-black w-full"
            rows={4}
            onChange={(e) => setProposalDetails(e.target.value)}
            value={proposalDetails}
          />
          <label className="label">
            <span className="label-text-alt opacity-80">
              Add the proposal title on the first line and the proposal
              description underneath.
            </span>
          </label>
        </Card>
        <Card>
          <SectionTitle>Governance Actions</SectionTitle>
          <div className="tabs mb-6">
            <a
              className={`tab tab-lg tab-lifted ${
                !isReallocation && "tab-active"
              }`}
              onClick={() => setIsReallocation(false)}
            >
              Custom
            </a>
            <a
              className={`tab tab-lg tab-lifted ${
                isReallocation && "tab-active"
              }`}
              onClick={() => setIsReallocation(true)}
            >
              Reallocation
            </a>
          </div>{" "}
          {isReallocation ? (
            <Reallocation proposalDetails={proposalDetails} />
          ) : (
            <>
              {newProposalActions.length === 0 ? (
                <ProposalActionsTableEmpty
                  onClickAdd={() => setModalOpen(true)}
                  onActionAdd={handleAddAction}
                />
              ) : (
                <>
                  <ProposalAddActionButton
                    className="btn btn-primary btn-sm mb-6"
                    onClick={() => setModalOpen(true)}
                    size="small"
                  />
                  <ProposalActionsTable
                    proposalActions={proposalActions}
                    onActionDelete={handleDeleteAction}
                    ephemeral={true}
                  />
                  <div className="flex">
                    <button
                      className="btn btn-primary mt-24"
                      disabled={
                        newProposalActions.length === 0 || submitDisabled
                      }
                      onClick={handleSubmit}
                    >
                      Submit Proposal
                    </button>
                  </div>
                </>
              )}
            </>
          )}
          <ProposalActionAddModal
            modalOpen={modalOpen}
            onModalClose={() => setModalOpen(false)}
            onActionAdd={handleAddAction}
          />
        </Card>
      </CardGroup>
      <EnsureDelegationModal />
    </Wrapper>
  );
};

export default ProposalNew;
