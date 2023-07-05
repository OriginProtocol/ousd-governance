import { PageTitle } from "components/PageTitle";
import { SectionTitle } from "components/SectionTitle";
import CardGroup from "components/CardGroup";
import Wrapper from "components/Wrapper";
import AccountBalances from "components/vote-escrow/AccountBalances";
import YourLockups from "components/vote-escrow/YourLockups";
import Seo from "components/Seo";

export default function VoteEscrow() {
  return (
    <Wrapper narrow>
      <Seo title="Stake OGV" />
      <PageTitle>Origin DeFi Governance</PageTitle>
      <SectionTitle>OGV Staking</SectionTitle>
      <CardGroup>
        <AccountBalances />
        <YourLockups />
      </CardGroup>
    </Wrapper>
  );
}
