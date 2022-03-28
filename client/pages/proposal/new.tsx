import { useState } from "react";
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

const ProposalNew: NextPage = () => {
  const { contracts, pendingTransactions } = useStore();
  const { Governance } = contracts;

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

  const [modalOpen, setModalOpen] = useState(false);

  const handleAddAction = (action: string) => {
    setNewProposalActions([...newProposalActions, action]);
  };

  const handleDeleteAction = (actionIndex: number) => {
    setNewProposalActions(
      newProposalActions.filter((_, index: number) => index !== actionIndex)
    );
  };

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
          Snapshot proposal should clearly detail the snapshotHash for the
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
