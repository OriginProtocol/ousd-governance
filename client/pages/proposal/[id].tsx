import type { NextPage } from "next";
import { ProposalDetail } from "components/proposal/ProposalDetail";
import { PageTitle } from "components/PageTitle";
import prisma from "lib/prisma";
import Wrapper from "components/Wrapper";
import Seo from "components/Seo";

export async function getServerSideProps({
  res,
  query,
}: {
  res: any;
  query: any;
}) {
  res.setHeader("Cache-Control", "s-maxage=1, stale-while-revalidate");

  const proposal = await prisma.proposal.findUnique({
    where: { proposalId: query.id },
  });

  const { proposalId, description } = proposal;

  return {
    props: { proposalId, description },
  };
}

const ProposalPage: NextPage = ({ proposalId, description }) => {
  return (
    <Wrapper>
      <Seo title="Proposal" />
      <PageTitle>Proposal</PageTitle>
      <ProposalDetail proposalId={proposalId} description={description} />
    </Wrapper>
  );
};

export default ProposalPage;
