import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "lib/prisma";

type Data = {};

const handler = async (req: NextApiRequest, res: NextApiResponse<Data>) => {
  const account: string = (req.query.account as string) || "";
  if (!account)
    return res.status(500).json({ error: "Missing account parameter" });

  const lockups = await prisma.lockup.findMany({
    where: {
      user: {
        equals: account,
      },
    },
  });

  return res.status(200).json({ lockups });
};

export default handler;
