import { ethers } from "ethers";
import { useState, useEffect } from "react";
import type { NextPage } from "next";
import { toast } from "react-toastify";
import { ProposalAddActionButton } from "components/proposal/ProposalAddActionButton";
import { ProposalActionAddModal } from "components/proposal/ProposalActionAddModal";
import { ProposalActionsTableEmpty } from "components/proposal/ProposalActionsTableEmpty";
import { ProposalActionsTable } from "components/proposal/ProposalActionsTable";
import { SectionTitle } from "components/SectionTitle";
import { PageTitle } from "components/PageTitle";
import { Reallocation } from "components/proposal/Reallocation";
import { useStickyState } from "utils/useStickyState";
import { useStore } from "utils/store";
import { truncateBalance } from "utils/index";

const ProposalNew: NextPage = () => {
  const { address, web3Provider, contracts, pendingTransactions } = useStore();
  const { Governance, VoteLockerCurve } = contracts;
  const [votePower, setVotePower] = useState(ethers.BigNumber.from(0));
  const [proposalThreshold, setProposalThreshold] = useState<number>(0);
  const [newProposalActions, setNewProposalActions] = useStickyState<Object>(
    [],
    "proposalActions"
  );
  const [snapshotHash, setSnapshotHash] = useStickyState<string>(
    "",
    "snapshotHash"
  );
  const [isReallocation, setIsReallocation] = useStickyState<boolean>(
    false,
    "isReallocation"
  );

  useEffect(() => {
    const loadProposalThreshold = async () => {
      console.log((await Governance.proposalThreshold()).toString());
      setProposalThreshold(await Governance.proposalThreshold());
    };
    loadProposalThreshold();
  }, [Governance]);

  // Load users vote power
  useEffect(() => {
    const loadVotePower = async () => {
      const votePower = await VoteLockerCurve.balanceOf(address);
      setVotePower(votePower);
    };
    if (web3Provider && address) {
      loadVotePower();
    }
  }, [address, web3Provider, VoteLockerCurve]);

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
    setSnapshotHash("");
    setIsReallocation(false);
  };

  const proposalActions = {
    targets: newProposalActions.map((a) => a.target),
    values: newProposalActions.map((a) => 0x0),
    signatures: newProposalActions.map((a) => a.signature),
    calldatas: newProposalActions.map((a) => a.calldata),
  };

  // Handle submit of the proposal (i.e. transaction)
  const handleSubmit = async () => {
    const transaction = await Governance[
      "propose(address[],uint256[],string[],bytes[],string)"
    ](
      proposalActions.targets,
      proposalActions.values,
      proposalActions.signatures,
      proposalActions.calldatas,
      snapshotHash
    );

    useStore.setState({
      pendingTransactions: [
        ...pendingTransactions,
        {
          ...transaction,
          onComplete: () => {
            toast.success("Proposal has been submitted", {
              hideProgressBar: true,
            });
            reset();
          },
        },
      ],
    });
  };

  if (votePower.lt(proposalThreshold)) {
    return (
      <div className="text-center pt-5">
        <h3 className="mt-2 font-medium text-gray-900">
          Minimum required vote power for a proposal is{" "}
          {proposalThreshold.toString()} votes. You have{" "}
          {truncateBalance(ethers.utils.formatUnits(votePower))} votes.
        </h3>
      </div>
    );
  }

  return (
    <>
      <PageTitle>New Proposal</PageTitle>
      <div className="-mt-6">
        <SectionTitle>Snapshot Proposal</SectionTitle>
      </div>
      <div className="form-control">
        <label className="label">
          <span className="label-text">Hash</span>
        </label>
        <input
          type="text"
          placeholder="0x0"
          className="input input-bordered"
          onChange={(e) => setSnapshotHash(e)}
        />
      </div>
      <label className="label">
        <span className="label-text-alt">
          For proposals that aren&apos;t simple reallocations, a Snapshot
          proposal should be used to signal intent before on chain happens. The
          Snapshot proposal should clearly detail the justification for the
          change.
        </span>
      </label>
      <SectionTitle>Governance Actions</SectionTitle>
      <div className="tabs mb-6">
        <a
          className={`tab tab-lg tab-lifted ${!isReallocation && "tab-active"}`}
          onClick={() => setIsReallocation(false)}
        >
          Custom
        </a>
        <a
          className={`tab tab-lg tab-lifted ${isReallocation && "tab-active"}`}
          onClick={() => setIsReallocation(true)}
        >
          Reallocation
        </a>
      </div>{" "}
      {isReallocation ? (
        <Reallocation />
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
            </>
          )}
        </>
      )}
      <ProposalActionAddModal
        modalOpen={modalOpen}
        onModalClose={() => setModalOpen(false)}
        onActionAdd={handleAddAction}
      />
      <div className="flex">
        <button
          className="btn btn-primary mt-24"
          disabled={newProposalActions.length === 0}
          onClick={handleSubmit}
        >
          Submit Proposal
        </button>
      </div>
    </>
  );
};

export default ProposalNew;
