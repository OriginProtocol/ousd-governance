import { ethers } from "ethers";
import { truncateBalance } from "utils/index";

export const ProposalVoteStats = ({
  proposal,
  votePower,
  onVote,
  hasVoted,
}) => {
  return (
    <div className="w-full shadow stats text-center">
      <div className="stat">
        <div className="stat-title">Your Vote Power</div>
        <div className="stat-value text-primary">
          {truncateBalance(ethers.utils.formatUnits(votePower))}
        </div>
      </div>{" "}
      <div className="stat">
        <div className="stat-title">For</div>
        <div className="stat-value text-success-content">
          {truncateBalance(ethers.utils.formatUnits(proposal.forVotes))}
        </div>
        {!hasVoted && (
          <button
            className="btn btn-sm btn-success w-100 mt-4"
            disabled={!votePower.gt(0)}
            onClick={() => onVote(1)}
          >
            Vote
          </button>
        )}
      </div>
      <div className="stat">
        <div className="stat-title">Against</div>
        <div className="stat-value text-error-content">
          {truncateBalance(ethers.utils.formatUnits(proposal.againstVotes))}
        </div>
        {!hasVoted && (
          <button
            className="btn btn-sm btn-error w-100 mt-4"
            disabled={!votePower.gt(0)}
            onClick={() => onVote(0)}
          >
            Vote
          </button>
        )}
      </div>
      <div className="stat">
        <div className="stat-title">Abstain</div>
        <div className="stat-value text-neutral">
          {truncateBalance(ethers.utils.formatUnits(proposal.abstainVotes))}
        </div>
        {!hasVoted && (
          <button
            className="btn btn-sm w-100 mt-4"
            disabled={!votePower.gt(0)}
            onClick={() => onVote(2)}
          >
            Vote
          </button>
        )}
      </div>
    </div>
  );
};
