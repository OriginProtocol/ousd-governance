import type { NextPage } from "next";
import { Disconnected } from "components/Disconnected";
import Card from "components/Card";
import CardGroup from "components/CardGroup";
import { useStore } from "utils/store";
import Wrapper from "components/Wrapper";

const ProposalNew: NextPage = () => {
  const { address, web3Provider, contracts, pendingTransactions } = useStore();

  if (!web3Provider) {
    return (
      <Wrapper narrow>
        <Disconnected />
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <Card>New lockup</Card>
    </Wrapper>
  );
};

export default ProposalNew;
