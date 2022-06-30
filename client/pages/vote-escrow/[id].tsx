import type { NextPage } from "next";
import { Disconnected } from "components/Disconnected";
import { useStore } from "utils/store";
import Wrapper from "components/Wrapper";
import { PageTitle } from "components/PageTitle";

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
  const { web3Provider, lockups } = useStore();
  const lockup = lockups?.find((lockup) => lockup.id === lockupId);

  console.log(lockups);

  console.log(lockup);

  if (!web3Provider) {
    return (
      <Wrapper narrow>
        <Disconnected />
      </Wrapper>
    );
  }

  return (
    <Wrapper narrow>
      <PageTitle>Extend Lockup</PageTitle>
    </Wrapper>
  );
};

export default LockupSingle;
