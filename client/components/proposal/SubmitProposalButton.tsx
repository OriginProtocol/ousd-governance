import { ethers } from "ethers";
import useGovernance from "utils/useGovernance";
import { truncateBalance } from "utils/index";
import Card from "components/Card";

export const SubmitProposalButton = ({ className, disabled, onClick }) => {
  const { proposalThreshold, votePower } = useGovernance();

  const votingPowerBelowThreshold = votePower.lt(proposalThreshold);

  return (
    <div className="flex pt-12 flex-col">
      {votingPowerBelowThreshold && (
        <div className="text-center mb-4">
          <Card tightPadding>
            <p className="mb-4 font-medium text-warning">
              Minimum required vote power for a proposal is{" "}
              {ethers.utils.formatUnits(proposalThreshold)} votes.
              <br />
              You have {truncateBalance(
                ethers.utils.formatUnits(votePower)
              )}{" "}
              votes.
            </p>
          </Card>
        </div>
      )}

      <button
        className={`${className} mr-auto`}
        disabled={disabled || votingPowerBelowThreshold}
        onClick={onClick}
      >
        Submit Proposal
      </button>
    </div>
  );
};
