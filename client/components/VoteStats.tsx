import numeral from "numeraljs";
import Card from "./Card";
import CardLabel from "./CardLabel";
import CardStat from "./CardStat";

export const VoteStats = ({
  proposalCount,
  holderCount,
  totalSupply,
}: {
  proposalCount: number | undefined;
  holderCount: number;
  totalSupply: number;
}) => {
  return (
    <div className="w-full grid sm:grid-cols-3 gap-3">
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
            <CardStat>{numeral(totalSupply / 1e18).format("0 a")}</CardStat>
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
    </div>
  );
};
