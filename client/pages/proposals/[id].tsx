import type { NextPage } from "next";
import { ProposalDetail } from "components/proposal/ProposalDetail";
import prisma from "lib/prisma";
import Wrapper from "components/Wrapper";
import Seo from "components/Seo";
import { getProposalContent } from "utils";

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
  const { title } = getProposalContent(description);

  return (
    <Wrapper narrow>
      <Seo title={title} />
      <ProposalDetail proposalId={proposalId} description={description} />
    </Wrapper>
  );
};

export default ProposalPage;
