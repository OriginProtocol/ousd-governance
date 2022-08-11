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
    include: { voters: true },
  });

  const { proposalId, description, voters } = proposal;

  return {
    props: {
      proposalId,
      description,
      voters: JSON.parse(JSON.stringify(voters)),
    },
  };
}

const ProposalPage: NextPage = ({ proposalId, description, voters }) => {
  const { title } = getProposalContent(description);

  return (
    <Wrapper narrow>
      <Seo title={title} />
      <ProposalDetail proposalId={proposalId} description={description} />
    </Wrapper>
  );
};

export default ProposalPage;
