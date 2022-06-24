import type { NextPage } from "next";
import { Disconnected } from "components/Disconnected";
import { useStore } from "utils/store";
import Wrapper from "components/Wrapper";
import { PageTitle } from "components/PageTitle";

const LockupSingle: NextPage = () => {
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
      <PageTitle>Extend Lockup</PageTitle>
    </Wrapper>
  );
};

export default LockupSingle;
