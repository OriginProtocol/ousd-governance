import type { NextPage } from "next";
import { Disconnected } from "components/Disconnected";
import { useStore } from "utils/store";
import Wrapper from "components/Wrapper";
import { PageTitle } from "components/PageTitle";
import LockupForm from "components/vote-escrow/LockupForm";
import Link from "components/Link";
import Seo from "components/Seo";
import CardGroup from "components/CardGroup";
import AccountBalances from "components/vote-escrow/AccountBalances";

const LockupNew: NextPage = () => {
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
      <Seo title="New Stake" />
      <PageTitle>New Stake</PageTitle>
      <CardGroup>
        <AccountBalances />
        <LockupForm />
      </CardGroup>
      <div className="mt-6">
        <Link className="btn rounded-full" href={`/stake`}>
          &larr; Back to OGV Staking
        </Link>
      </div>
    </Wrapper>
  );
};

export default LockupNew;
