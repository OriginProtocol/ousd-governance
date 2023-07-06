import { PageTitle } from "components/PageTitle";
import { SectionTitle } from "components/SectionTitle";
import Wrapper from "components/Wrapper";
import Seo from "components/Seo";
import RegisterToVote from "components/proposal/RegisterToVote";

export default function VoteEscrow() {
  return (
    <Wrapper narrow>
      <Seo title="Register Vote" />
      <PageTitle>Origin DeFi Governance</PageTitle>
      <SectionTitle>Register Vote</SectionTitle>
      <RegisterToVote whiteRegisterCta showNoVeOgvMessage withCard />
    </Wrapper>
  );
}
