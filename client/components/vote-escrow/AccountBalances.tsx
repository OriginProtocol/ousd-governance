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
  const { ogv, veOgv, accruedRewards } = balances;

  const totalOgvLockedUp =
    lockups &&
    lockups.length > 0 &&
    lockups.reduce((total: ethers.BigNumber, lockup) => {
      return total.add(lockup.amount);
    }, ethers.BigNumber.from("0"));

  const cardContentData = [
    {
      label: "Balance",
      amount: ogv,
      description: "OGV",
      icon: "/ogv.svg",
    },
    {
      label: "Staked",
      amount: totalOgvLockedUp,
      description: "OGV",
      icon: "/ogv.svg",
    },
    {
      label: "Vote balance",
      amount: veOgv,
      description: "veOGV",
      icon: "/veogv.svg",
    },
    {
      label: "Accrued Rewards",
      amount: accruedRewards,
      description: "OGV",
      icon: "/ogv.svg",
    },
  ];

  return (
    <>
      <CardGroup horizontal fourCol>
        {cardContentData.map((data) => {
          return (
            <Card dark tightPadding key={data.label}>
              <div className="space-y-1">
                <CardLabel>{data.label}</CardLabel>
                <div className="flex space-x-1 items-center">
                  <TokenIcon src={data.icon} alt={data.description} small />
                  <CardStat small>
                    <TokenAmount amount={data.amount} />
                  </CardStat>
                </div>
                <CardDescription>{data.description}</CardDescription>
              </div>
            </Card>
          );
        })}
      </CardGroup>
    </>
  );
};

export default AccountBalances;
