import { PageTitle } from "components/PageTitle";
import CardGroup from "components/CardGroup";
import Wrapper from "components/Wrapper";
import AccountBalances from "components/vote-escrow/AccountBalances";
import YourLockups from "components/vote-escrow/YourLockups";
import { Disconnected } from "components/Disconnected";
import { useStore } from "utils/store";
import Seo from "components/Seo";

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
      <Seo title="Stake OGV" />
      <PageTitle>OGV Staking</PageTitle>
      <CardGroup>
        <AccountBalances />
        <YourLockups />
      </CardGroup>
    </Wrapper>
  );
}
