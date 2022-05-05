import { ethers } from "ethers";
import { truncateBalance } from "utils/index";
import CardGroup from "components/CardGroup";
import Card from "components/Card";
import CardLabel from "components/CardLabel";
import CardStat from "components/CardStat";
import TokenAmount from "components/TokenAmount";

export const ProposalVoteStats = ({
  proposal,
  votePower,
  onVote,
  hasVoted,
}) => {
  return (
    <CardGroup horizontal fourCol>
      <div>
        <Card dark tightPadding>
          <CardLabel>Your Vote Power</CardLabel>
          <CardStat>
            <TokenAmount amount={votePower} />
          </CardStat>
        </Card>
      </div>
      <div>
        <Card dark tightPadding>
          <CardLabel>For</CardLabel>
          <CardStat>
            <TokenAmount amount={proposal.forVotes} />
          </CardStat>
          {!hasVoted && (
            <button
              className="btn btn-sm btn-success w-full mt-4"
              disabled={!votePower.gt(0)}
              onClick={() => onVote(1)}
            >
              Vote
            </button>
          )}
        </Card>
      </div>
      <div>
        <Card dark tightPadding>
          <CardLabel>Against</CardLabel>
          <CardStat>
            <TokenAmount amount={proposal.againstVotes} />
          </CardStat>
          {!hasVoted && (
            <button
              className="btn btn-sm btn-error w-full mt-4"
              disabled={!votePower.gt(0)}
              onClick={() => onVote(0)}
            >
              Vote
            </button>
          )}
        </Card>
      </div>
      <div>
        <Card dark tightPadding>
          <CardLabel>Abstain</CardLabel>
          <CardStat>
            <TokenAmount amount={proposal.abstainVotes} />
          </CardStat>
          {!hasVoted && (
            <button
              className="btn btn-sm w-full mt-4"
              disabled={!votePower.gt(0)}
              onClick={() => onVote(2)}
            >
              Vote
            </button>
          )}
        </Card>
      </div>
    </CardGroup>
  );
};
