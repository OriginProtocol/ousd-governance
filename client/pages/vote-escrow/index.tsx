import { PageTitle } from "components/PageTitle";
import CardGroup from "components/CardGroup";
import Wrapper from "components/Wrapper";
import AccountBalances from "components/vote-escrow/AccountBalances";
import YourLockups from "components/vote-escrow/YourLockups";
import { Disconnected } from "components/Disconnected";
import { useStore } from "utils/store";

export default function VoteEscrow() {
  const { web3Provider } = useStore();

  if (!web3Provider) {
    return (
      <Wrapper narrow>
        <Disconnected />
      </Wrapper>
    );
  }

  return (
    <Wrapper narrow>
      <PageTitle>Vote Escrow</PageTitle>
      <CardGroup>
        <AccountBalances />
        <YourLockups />
      </CardGroup>
    </Wrapper>
  );
}
