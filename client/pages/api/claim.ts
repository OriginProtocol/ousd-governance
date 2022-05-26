import type { NextApiRequest, NextApiResponse } from "next";
import path from "path";
import fs from "fs";

type Data = {
  index?: number;
  amount?: number;
  proof?: string[];
  hasClaim?: boolean;
  error?: string | undefined;
};

const { claims } = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "../scripts/claims.json"), "utf8")
);

const handler = (req: NextApiRequest, res: NextApiResponse<Data>) => {
  const account: string = (req.query.account as string) || "";
  if (!account)
    return res.status(500).json({ error: "Missing account parameter" });

  const hasClaim = !!claims[account];
  const index = claims[account]?.index || 0;
  const amount = claims[account]?.amount || 0;
  const proof = claims[account]?.proof || [];
  const split = claims[account]?.split || {};

  return res.status(200).json({ index, amount, proof, hasClaim, split });
};

export default handler;
