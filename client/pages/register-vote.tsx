import { PageTitle } from "components/PageTitle";
import CardGroup from "components/CardGroup";
import Wrapper from "components/Wrapper";
import AccountBalances from "components/vote-escrow/AccountBalances";
import YourLockups from "components/vote-escrow/YourLockups";
import Seo from "components/Seo";
import RegisterToVote from "components/proposal/RegisterToVote";

export default function VoteEscrow() {
  return (
    <Wrapper narrow>
      <Seo title="Register Vote" />
      <PageTitle>Register Vote</PageTitle>
      <RegisterToVote noVeOgvMessage withCard />
    </Wrapper>
  );
}
