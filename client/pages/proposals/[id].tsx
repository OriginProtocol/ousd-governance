import type { NextPage } from "next";
import { ProposalDetail } from "components/proposal/ProposalDetail";
import prisma from "lib/prisma";
import Wrapper from "components/Wrapper";
import Seo from "components/Seo";
import { getProposalContent } from "utils";
import moment from "moment";

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

  const { id, proposalId, createdAt, description, voters } = proposal;

  return {
    props: {
      id,
      proposalId,
      createdAt: moment(createdAt).format("MMM D, YYYY"),
      description,
      voters: JSON.parse(JSON.stringify(voters)),
    },
  };
}

const ProposalPage: NextPage = ({
  id,
  proposalId,
  createdAt,
  description,
  voters,
}) => {
  const { title } = getProposalContent(description);

  return (
    <Wrapper narrow>
      <Seo title={title} />
      <ProposalDetail
        id={id}
        proposalId={proposalId}
        createdAt={createdAt}
        description={description}
        voters={voters}
      />
    </Wrapper>
  );
};

export default ProposalPage;
