import { FunctionComponent } from "react";
import CardGroup from "./CardGroup";
import Card from "./Card";
import CardLabel from "./CardLabel";
import CardStat from "./CardStat";
import TokenAmount from "./TokenAmount";
import TokenIcon from "./TokenIcon";
import { BigNumber } from "ethers";
import Icon from "@mdi/react";
import { mdiFileDocumentOutline, mdiAccountOutline } from "@mdi/js";

interface VoteStatsProps {
  proposalCount: number | undefined;
  holderCount: number;
  totalSupply: BigNumber;
}

const VoteStats: FunctionComponent<VoteStatsProps> = ({
  proposalCount,
  holderCount,
  totalSupply,
}) => {
  return (
    <CardGroup horizontal>
      <Card dark tightPadding>
        <div className="space-y-1">
          <CardLabel>Proposals</CardLabel>
          <div className="flex space-x-1 items-center">
            <Icon
              path={mdiFileDocumentOutline}
              size={1}
              className="text-gray-200"
            />
            <CardStat small>{proposalCount}</CardStat>
          </div>
        </div>
      </Card>
      <Card dark tightPadding>
        <div className="space-y-1">
          <CardLabel>Vote Supply</CardLabel>
          <div className="flex space-x-1 items-center">
            <TokenIcon src="/veogv.svg" alt="veOGV" small />
            <CardStat small>
              <TokenAmount amount={totalSupply} />
            </CardStat>
          </div>
        </div>
      </Card>
      <Card dark tightPadding>
        <div className="space-y-1">
          <CardLabel>Voting Addresses</CardLabel>
          <div className="flex space-x-1 items-center">
            <Icon path={mdiAccountOutline} size={1} className="text-gray-200" />
            <CardStat small>{holderCount}</CardStat>
          </div>
        </div>
      </Card>
    </CardGroup>
  );
};

export { VoteStats };
