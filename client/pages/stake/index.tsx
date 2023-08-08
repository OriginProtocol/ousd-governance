import dynamic from "next/dynamic";
import { PageTitle } from "components/PageTitle";
import { SectionTitle } from "components/SectionTitle";
import CardGroup from "components/CardGroup";
import Wrapper from "components/Wrapper";
import Seo from "components/Seo";

const AccountBalances = dynamic(
  () => import("components/vote-escrow/AccountBalances"),
  {
    ssr: false,
  }
);

const YourLockups = dynamic(
  () => import("components/vote-escrow/YourLockups"),
  {
    ssr: false,
  }
);

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
