import { useState } from "react";
import type { NextPage } from "next";
import ReactMarkdown from "react-markdown";
import { ProposalAddActionButton } from "components/proposal/ProposalAddActionButton";
import { ProposalActionAddModal } from "components/proposal/ProposalActionAddModal";
import { ProposalActionsTableEmpty } from "components/proposal/ProposalActionsTableEmpty";
import { ProposalActionsTable } from "components/proposal/ProposalActionsTable";
import { SectionTitle } from "components/SectionTitle";
import { PageTitle } from "components/PageTitle";
import { contracts } from "constants/index";
import { truncateEthAddress } from "utils/index";
import { useStickyState } from "utils/useStickyState";

const ProposalNew: NextPage = () => {
  const [newProposalActions, setNewProposalActions] = useStickyState<Object>(
    [],
    "proposalActions"
  );
  const [justification, setJustification] = useStickyState<string>(
    "",
    "justification"
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [isPreview, setIsPreview] = useState(false);

  const handleAddAction = (action: string) => {
    setNewProposalActions([...newProposalActions, action]);
  };

  const handleDeleteAction = (actionIndex: number) => {
    setNewProposalActions(
      newProposalActions.filter((_, index) => index !== actionIndex)
    );
  };

  const proposalActions = {
    targets: newProposalActions.map((a) => a.target),
    signatures: newProposalActions.map((a) => a.signature),
    calldatas: newProposalActions.map((a) => a.calldata),
  };

  const proposal = {
    ...proposalActions,
    description: justification,
  };

  return (
    <>
      <PageTitle>New Proposal</PageTitle>
      <div className="-mt-6">
        <SectionTitle>Justification</SectionTitle>
      </div>
      <div className="tabs tabs-boxed mb-2">
        <a
          className={`tab ${!isPreview && "tab-active"}`}
          onClick={() => setIsPreview(false)}
        >
          Code
        </a>
        <a
          className={`tab ${isPreview && "tab-active"}`}
          onClick={() => setIsPreview(true)}
        >
          Preview
        </a>
      </div>
      {isPreview ? (
        <article className="prose p-6 bg-base-200 w-full max-w-full">
          <ReactMarkdown>{justification}</ReactMarkdown>
        </article>
      ) : (
        <div className="form-control w-full">
          <textarea
            className="textarea h-36 w-full textarea-bordered"
            onChange={(e) => setJustification(e.target.value)}
            value={justification}
          ></textarea>
          <label className="label">
            <span className="label-text-alt">
              Please use{" "}
              <a href="https://www.markdownguide.org/basic-syntax/">Markdown</a>{" "}
              syntax
            </span>
          </label>
        </div>
      )}
      <SectionTitle>Governance Actions</SectionTitle>
      <div className="tabs mb-6">
        <a className="tab tab-lg tab-lifted tab-active">Custom</a>
        <a className="tab tab-lg tab-lifted">Reallocation</a>
      </div>{" "}
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
      <ProposalActionAddModal
        modalOpen={modalOpen}
        onModalClose={() => setModalOpen(false)}
        onActionAdd={handleAddAction}
      />
      <div className="flex">
        <button className="btn btn-primary mt-24">Submit Proposal</button>
      </div>
    </>
  );
};

export default ProposalNew;
