import { PageTitle } from "components/PageTitle";
import CardGroup from "components/CardGroup";
import Wrapper from "components/Wrapper";
import AccountBalances from "components/vote-escrow/AccountBalances";
import YourLockups from "components/vote-escrow/YourLockups";
import OgvTotalStats from "components/OgvTotalStats";
import { SectionTitle } from "components/SectionTitle";

export default function VoteEscrow() {
  return (
    <Wrapper narrow>
      <PageTitle>Vote Escrow</PageTitle>
      <CardGroup>
        <AccountBalances />
        <YourLockups />
        <SectionTitle>Total Stats</SectionTitle>
        <OgvTotalStats alt />
      </CardGroup>
    </Wrapper>
  );
}
