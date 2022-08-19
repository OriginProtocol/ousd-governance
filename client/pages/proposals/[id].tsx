import type { NextPage } from "next";
import { ProposalDetail } from "components/proposal/ProposalDetail";
import prisma from "lib/prisma";
import Wrapper from "components/Wrapper";
import Seo from "components/Seo";
import { getCleanProposalContent } from "utils";
import moment from "moment";
import Link from "components/Link";
import Icon from "@mdi/react";
import { mdiArrowLeft } from "@mdi/js";

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
    include: { voters: true, transactions: true },
  });

  const { id, proposalId, createdAt, description, voters, transactions } =
    proposal;

  return {
    props: {
      id,
      proposalId,
      createdAt: moment(createdAt).format("MMM D, YYYY"),
      description,
      voters: JSON.parse(JSON.stringify(voters)),
      transactions: JSON.parse(JSON.stringify(transactions)),
    },
  };
}

const ProposalPage: NextPage = ({
  id,
  proposalId,
  createdAt,
  description,
  voters,
  transactions,
}) => {
  const { cleanTitle } = getCleanProposalContent(description);

  return (
    <Wrapper narrow>
      <Seo title={cleanTitle} />
      <Link
        className="mb-5 flex items-center uppercase text-xs font-bold text-gray-300 hover:text-white"
        href="/proposals"
      >
        <Icon className="mr-1" path={mdiArrowLeft} size={0.75} />
        Proposals
      </Link>
      <ProposalDetail
        id={id}
        proposalId={proposalId}
        createdAt={createdAt}
        description={description}
        voters={voters}
        transactions={transactions}
      />
    </Wrapper>
  );
};

export default ProposalPage;
