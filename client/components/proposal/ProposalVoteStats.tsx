import CardGroup from "components/CardGroup";
import Card from "components/Card";
import CardLabel from "components/CardLabel";
import CardStat from "components/CardStat";
import TokenAmount from "components/TokenAmount";
import TokenIcon from "components/TokenIcon";
import CardDescription from "../CardDescription";

export const ProposalVoteStats = ({
  proposal,
  votePower,
  onVote,
  hasVoted,
}) => {
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
          <CardDescription>At start block</CardDescription>
        </div>
      </Card>
      <Card dark tightPadding>
        <div className="space-y-1">
          <CardLabel>For Votes</CardLabel>
          <div className="flex space-x-1 items-center">
            <TokenIcon src="/veogv.svg" alt="veOGV" small />
            <CardStat small>
              <TokenAmount amount={proposal.forVotes} />
            </CardStat>
          </div>
        </div>
        {!hasVoted && (
          <button
            className="btn btn-sm btn-success w-full mt-4"
            disabled={!votePower.gt(0)}
            onClick={() => onVote(1)}
          >
            Vote For
          </button>
        )}
      </Card>
      <Card dark tightPadding>
        <div className="space-y-1">
          <CardLabel>Against Votes</CardLabel>
          <div className="flex space-x-1 items-center">
            <TokenIcon src="/veogv.svg" alt="veOGV" small />
            <CardStat small>
              <TokenAmount amount={proposal.againstVotes} />
            </CardStat>
          </div>
        </div>
        {!hasVoted && (
          <button
            className="btn btn-sm btn-error w-full mt-4"
            disabled={!votePower.gt(0)}
            onClick={() => onVote(0)}
          >
            Vote Against
          </button>
        )}
      </Card>
      <Card dark tightPadding>
        <div className="space-y-1">
          <CardLabel>Abstain Votes</CardLabel>
          <div className="flex space-x-1 items-center">
            <TokenIcon src="/veogv.svg" alt="veOGV" small />
            <CardStat small>
              <TokenAmount amount={proposal.abstainVotes} />
            </CardStat>
          </div>
        </div>
        {!hasVoted && (
          <button
            className="btn btn-sm w-full mt-4"
            disabled={!votePower.gt(0)}
            onClick={() => onVote(2)}
          >
            Abstain
          </button>
        )}
      </Card>
    </CardGroup>
  );
};
