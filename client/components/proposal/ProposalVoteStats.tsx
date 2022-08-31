import CardGroup from "components/CardGroup";
import Card from "components/Card";
import CardLabel from "components/CardLabel";
import CardStat from "components/CardStat";
import TokenAmount from "components/TokenAmount";
import TokenIcon from "components/TokenIcon";
import DisabledButtonTooltip from "components/DisabledButtonTooltip";
import { BigNumber } from "ethers";
export const ProposalVoteStats = ({
  proposal,
  votePower,
  onVote,
  hasVoted,
  votingActive,
}) => {
  let tooltipText = "";
  if (BigNumber.isBigNumber(votePower) && !votePower.gt(0)) {
    tooltipText = "You don't have enough votes";
  } else if (hasVoted) {
    tooltipText = "You've already voted";
  }

  const showTooltip = !votePower.gt(0) || hasVoted;

  return (
    <CardGroup horizontal fourCol>
      <Card dark tightPadding>
        <div className="space-y-1">
          <CardLabel>Your Votes</CardLabel>
          <div className="flex space-x-1 items-center">
            <TokenIcon src="/veogv.svg" alt="veOGV" small />
            <CardStat small>
              <TokenAmount amount={votePower} />
            </CardStat>
          </div>
        </div>
      </Card>
      <Card dark tightPadding>
        <div className="space-y-1 mb-4">
          <CardLabel>For Votes</CardLabel>
          <div className="flex space-x-1 items-center">
            <TokenIcon src="/veogv.svg" alt="veOGV" small />
            <CardStat small>
              <TokenAmount amount={proposal.forVotes} />
            </CardStat>
          </div>
        </div>
        {votingActive && (
          <DisabledButtonTooltip text={tooltipText} show={showTooltip}>
            <button
              className="btn btn-sm btn-success w-full disabled:text-gray-200 disabled:text-opacity-30"
              disabled={showTooltip}
              onClick={() => onVote(1)}
            >
              Vote For
            </button>
          </DisabledButtonTooltip>
        )}
      </Card>
      <Card dark tightPadding>
        <div className="space-y-1 mb-4">
          <CardLabel>Against Votes</CardLabel>
          <div className="flex space-x-1 items-center">
            <TokenIcon src="/veogv.svg" alt="veOGV" small />
            <CardStat small>
              <TokenAmount amount={proposal.againstVotes} />
            </CardStat>
          </div>
        </div>
        {votingActive && (
          <DisabledButtonTooltip text={tooltipText} show={showTooltip}>
            <button
              className="btn btn-sm btn-error w-full  disabled:text-gray-200 disabled:text-opacity-30"
              disabled={showTooltip}
              onClick={() => onVote(0)}
            >
              Vote Against
            </button>
          </DisabledButtonTooltip>
        )}
      </Card>
      <Card dark tightPadding>
        <div className="space-y-1  mb-4">
          <CardLabel>Abstain Votes</CardLabel>
          <div className="flex space-x-1 items-center">
            <TokenIcon src="/veogv.svg" alt="veOGV" small />
            <CardStat small>
              <TokenAmount amount={proposal.abstainVotes} />
            </CardStat>
          </div>
        </div>
        {votingActive && (
          <DisabledButtonTooltip text={tooltipText} show={showTooltip}>
            <button
              className="btn btn-sm w-full disabled:text-gray-200 disabled:text-opacity-30"
              disabled={showTooltip}
              onClick={() => onVote(2)}
            >
              Abstain
            </button>
          </DisabledButtonTooltip>
        )}
      </Card>
    </CardGroup>
  );
};
