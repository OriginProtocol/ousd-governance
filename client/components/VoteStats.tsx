import CardGroup from "./CardGroup";
import Card from "./Card";
import CardLabel from "./CardLabel";
import CardStat from "./CardStat";
import TokenAmount from "./TokenAmount";
import { BigNumber } from "ethers";

export const VoteStats = ({
  proposalCount,
  holderCount,
  totalSupply,
}: {
  proposalCount: number | undefined;
  holderCount: number;
  totalSupply: BigNumber;
}) => {
  return (
    <CardGroup horizontal>
      <div>
        <Card dark tightPadding>
          <div className="space-y-2">
            <CardLabel>Proposals</CardLabel>
            <CardStat>{proposalCount}</CardStat>
          </div>
        </Card>
      </div>
      <div>
        <Card dark tightPadding>
          <div className="space-y-2">
            <CardLabel>Vote Supply</CardLabel>
            <CardStat>
              <TokenAmount amount={totalSupply} />
            </CardStat>
          </div>
        </Card>
      </div>
      <div>
        <Card dark tightPadding>
          <div className="space-y-2">
            <CardLabel>Vote Addresses</CardLabel>
            <CardStat>{holderCount}</CardStat>
          </div>
        </Card>
      </div>
    </CardGroup>
  );
};
