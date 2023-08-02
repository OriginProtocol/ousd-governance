import type { NextPage } from "next";
import { Disconnected } from "components/Disconnected";
import Wrapper from "components/Wrapper";
import { PageTitle } from "components/PageTitle";
import LockupForm from "components/vote-escrow/LockupForm";
import Seo from "components/Seo";
import CardGroup from "components/CardGroup";
import AccountBalances from "components/vote-escrow/AccountBalances";
import { SectionTitle } from "@/components/SectionTitle";
import { useAccount } from "wagmi";

const LockupNew: NextPage = () => {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <Wrapper narrow>
        <Disconnected />
      </Wrapper>
    );
  }

  return (
    <Wrapper narrow>
      <Seo title="New Stake" />
      <PageTitle>Origin DeFi Governance</PageTitle>
      <SectionTitle>OGV Staking</SectionTitle>
      <CardGroup>
        <AccountBalances />
        <LockupForm />
      </CardGroup>
    </Wrapper>
  );
};

export default LockupNew;
