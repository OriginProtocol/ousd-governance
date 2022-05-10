import { FunctionComponent } from "react";
import { useStore } from "utils/store";
import CardGroup from "components/CardGroup";
import Card from "components/Card";
import CardLabel from "components/CardLabel";
import CardStat from "components/CardStat";
import { SectionTitle } from "components/SectionTitle";

interface LockupStatsProps {
  lockupCount: number;
  totalLockupWeeks: number;
  totalTokensLockedUp: string;
}

const LockupStats: FunctionComponent<LockupStatsProps> = ({
  lockupCount,
  totalLockupWeeks,
  totalTokensLockedUp,
}) => {
  const { totalBalances } = useStore();

  if (lockupCount === 0) return null;

  const { totalSupply } = totalBalances;

  const percentageLockedUp =
    (parseInt(totalTokensLockedUp) / totalSupply) * 100;
  const averageLockupLength = Math.round(totalLockupWeeks / lockupCount);

  return (
    <Card alt>
      <SectionTitle>Total OGV lockup stats</SectionTitle>
      <CardGroup horizontal twoCol>
        <div>
          <Card tightPadding>
            <div className="space-y-1">
              <CardLabel>Amount locked up</CardLabel>
              <CardStat>{percentageLockedUp.toFixed(2)}%</CardStat>
            </div>
          </Card>
        </div>
        <div>
          <Card tightPadding>
            <div className="space-y-1">
              <CardLabel>Average lock time</CardLabel>
              <CardStat>{averageLockupLength} weeks</CardStat>
            </div>
          </Card>
        </div>
      </CardGroup>
    </Card>
  );
};

export default LockupStats;
