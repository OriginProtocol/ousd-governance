import type { NextPage } from "next";
import { ProposalDetail } from "components/proposal/ProposalDetail";
import { PageTitle } from "components/PageTitle";
import prisma from "lib/prisma";
import Layout from "components/layout";

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
    <Layout>
      <PageTitle>Proposal</PageTitle>
      <ProposalDetail proposalId={proposalId} description={description} />
    </Layout>
  );
};

export default ProposalPage;
