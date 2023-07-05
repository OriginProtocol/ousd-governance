import type { NextPage } from "next";
import { Disconnected } from "components/Disconnected";
import { useStore } from "utils/store";
import Wrapper from "components/Wrapper";
import Link from "components/Link";
import { PageTitle } from "components/PageTitle";
import LockupForm from "components/vote-escrow/LockupForm";
import { find } from "lodash";
import Seo from "components/Seo";
import CardGroup from "components/CardGroup";
import AccountBalances from "components/vote-escrow/AccountBalances";

export async function getServerSideProps({
  res,
  query,
}: {
  res: any;
  query: any;
}) {
  res.setHeader("Cache-Control", "s-maxage=1, stale-while-revalidate");

  return {
    props: { lockupId: query.id },
  };
}

interface LockupSingleProps {
  lockupId: string;
}

const LockupSingle: NextPage<LockupSingleProps> = ({ lockupId }) => {
  const { web3Provider, address, lockups } = useStore();
  const lockup = find(lockups, { lockupId: parseInt(lockupId) });

  if (!web3Provider) {
    return (
      <Wrapper narrow>
        <Disconnected />
      </Wrapper>
    );
  }

  if (!lockup) {
  }

  return (
    <Wrapper narrow>
      <Seo title="Extend Stake" />
      <PageTitle>Extend Stake</PageTitle>
      <CardGroup>
        <AccountBalances />
        {!lockup && <p className="text-gray-300">No stake found.</p>}
        {lockup && lockup?.user !== address && (
          <p className="text-gray-300">This lockup isn&apos;t yours.</p>
        )}
        {lockup && lockup?.user === address && (
          <LockupForm existingLockup={lockup} />
        )}
      </CardGroup>
    </Wrapper>
  );
};

export default LockupSingle;
