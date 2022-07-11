import { FunctionComponent } from "react";
import CardGroup from "components/CardGroup";
import Card from "components/Card";
import CardLabel from "components/CardLabel";
import CardStat from "components/CardStat";
import CardDescription from "components/CardDescription";
import TokenIcon from "components/TokenIcon";
import TokenAmount from "components/TokenAmount";
import { useStore } from "utils/store";
import { ethers } from "ethers";

interface AccountBalancesProps {}

const AccountBalances: FunctionComponent<AccountBalancesProps> = () => {
  const { balances, lockups } = useStore();
  const { ogv, veOgv } = balances;

  const totalOgvLockedUp =
    lockups &&
    lockups.length > 0 &&
    lockups.reduce((total: ethers.BigNumber, lockup) => {
      return total.add(lockup.amount);
    }, ethers.BigNumber.from("0"));

  return (
    <CardGroup horizontal>
      <Card dark tightPadding>
        <div className="space-y-1">
          <CardLabel>Balance</CardLabel>
          <div className="flex space-x-1 items-center">
            <TokenIcon src="/ogv.svg" alt="OGV" />
            <CardStat>
              <TokenAmount amount={ogv} />
            </CardStat>
          </div>
          <CardDescription>OGV</CardDescription>
        </div>
      </Card>
      <Card dark tightPadding>
        <div className="space-y-1">
          <CardLabel>Staked</CardLabel>
          <div className="flex space-x-1 items-center">
            <TokenIcon src="/ogv.svg" alt="OGV" />
            <CardStat>
              <TokenAmount amount={totalOgvLockedUp} />
            </CardStat>
          </div>
          <CardDescription>OGV</CardDescription>
        </div>
      </Card>
      <Card dark tightPadding>
        <div className="space-y-1">
          <CardLabel>Vote balance</CardLabel>
          <div className="flex space-x-1 items-center">
            <TokenIcon src="/veogv.svg" alt="veOGV" />
            <CardStat>
              <TokenAmount amount={veOgv} />
            </CardStat>
          </div>
          <CardDescription>veOGV</CardDescription>
        </div>
      </Card>
    </CardGroup>
  );
};

export default AccountBalances;
