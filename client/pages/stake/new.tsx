import type { NextPage } from "next";
import { Disconnected } from "components/Disconnected";
import { useStore } from "utils/store";
import Wrapper from "components/Wrapper";
import { PageTitle } from "components/PageTitle";
import LockupForm from "components/vote-escrow/LockupForm";
import Link from "components/Link";

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
      <PageTitle>New Stake</PageTitle>
      <LockupForm />
      <div className="mt-6">
        <Link className="btn rounded-full" href={`/stake`}>
          &larr; Back to OGV Staking
        </Link>
      </div>
    </Wrapper>
  );
};

export default LockupNew;
