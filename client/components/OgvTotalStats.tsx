import { FunctionComponent } from "react";
import CardGroup from "components/CardGroup";
import Card from "components/Card";
import CardLabel from "components/CardLabel";
import CardStat from "components/CardStat";
import CardDescription from "components/CardDescription";
import TokenIcon from "components/TokenIcon";
import TokenAmount from "components/TokenAmount";
import { useStore } from "utils/store";

interface OgvTotalStatsProps {
  alt?: Boolean;
}

const OgvTotalStats: FunctionComponent<OgvTotalStatsProps> = ({ alt }) => {
  const { totalBalances } = useStore();
  const { totalSupplyOfOgv, totalLockedUpOgv, totalPercentageOfLockedUpOgv } = totalBalances;

  return (
    <CardGroup horizontal>
      <div>
        <Card dark={!alt} alt={alt} tightPadding>
          <div className="space-y-1">
            <CardLabel>Total supply</CardLabel>
            <div className="flex space-x-1 items-center">
              <TokenIcon src="/ogv.svg" alt="OGV" />
              <CardStat>
                <TokenAmount amount={totalSupplyOfOgv} />
              </CardStat>
            </div>
            <CardDescription>OGV</CardDescription>
          </div>
        </Card>
      </div>
      <div>
        <Card dark={!alt} alt={alt} tightPadding>
          <div className="space-y-1">
            <CardLabel>Staked</CardLabel>
            <div className="flex space-x-1 items-center">
              <TokenIcon src="/ogv.svg" alt="OGV" />
              <CardStat>
                <TokenAmount amount={totalLockedUpOgv} />
              </CardStat>
            </div>
            <CardDescription>OGV</CardDescription>
          </div>
        </Card>
      </div>
      <div>
        <Card dark={!alt} alt={alt} tightPadding>
          <div className="space-y-1">
            <CardLabel>% staked</CardLabel>
            <div className="flex space-x-1 items-center">
              <TokenIcon src="/ogv.svg" alt="OGV" />
              <CardStat>{totalPercentageOfLockedUpOgv.toFixed(2)}%</CardStat>
            </div>
            <CardDescription>OGV</CardDescription>
          </div>
        </Card>
      </div>
    </CardGroup>
  );
};

export default OgvTotalStats;
