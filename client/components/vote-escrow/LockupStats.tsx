import { FunctionComponent } from "react";
import { useStore } from "utils/store";
import Card from "components/Card";
import { SectionTitle } from "components/SectionTitle";

const LockupStats: FunctionComponent = () => {
  const { totalBalances } = useStore();
  const { totalSupply, lockedUpSupply } = totalBalances;

  return (
    <Card>
      <SectionTitle>Total Lockup Stats</SectionTitle>
      <p>{totalSupply.toString()}</p>
      <p>{lockedUpSupply.toString()}</p>
    </Card>
  );
};

export default LockupStats;
