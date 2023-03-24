import { NextApiRequest, NextApiResponse } from "next";
import prisma from "lib/prisma";

interface Proposal {
  id: number;
  proposalId: string;
  createdAt: string;
  description: string;
  transactions: any;
}

interface Data {
  count: number;
  proposals?: Proposal[];
}

const handler = async (req: NextApiRequest, res: NextApiResponse<Data>) => {
  const rawProposals = await prisma.proposal.findMany({
    orderBy: { id: "desc" },
    include: { transactions: true },
  });

  if (req.query.onlyCount)
    return res.status(200).json({ count: rawProposals.length });

  const proposals = rawProposals.map((p) => ({
    id: p.id,
    proposalId: p.proposalId,
    createdAt: p.createdAt.toString(),
    description: p.description,
    transactions: JSON.parse(JSON.stringify(p.transactions)), // transactions.createdAt [object Date] cannot be serialized as JSON without JSON.parse/stringify
  }));

  return res.status(200).json({ count: proposals.length, proposals });
};

export default handler;
