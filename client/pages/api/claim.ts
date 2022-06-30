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

const isDevMode = process.env.NODE_ENV === "development";
const { claims: optionalClaims } = JSON.parse(
  fs.readFileSync(
    path.join(
      process.cwd(),
      `../scripts/${process.env.NETWORK_ID}_data/optional_lockup_claims.json`
    ),
    "utf8"
  )
);
const { claims: mandatoryClaims } = JSON.parse(
  fs.readFileSync(
    path.join(
      process.cwd(),
      `../scripts/${process.env.NETWORK_ID}_data/mandatory_lockup_claims.json`
    ),
    "utf8"
  )
);

const handler = (req: NextApiRequest, res: NextApiResponse<Data>) => {
  const account: string = (req.query.account as string) || "";
  if (!account)
    return res.status(500).json({ error: "Missing account parameter" });

  const getClaimDataFromClaims = (claimsSource) => {
    const hasClaim = !!claimsSource[account];
    const index = claimsSource[account]?.index || 0;
    const amount = claimsSource[account]?.amount || 0;
    const proof = claimsSource[account]?.proof || [];
    const split = claimsSource[account]?.split || {};

    return { index, amount, proof, hasClaim, split };
  };

  return res.status(200).json({
    optional: getClaimDataFromClaims(optionalClaims),
    mandatory: getClaimDataFromClaims(mandatoryClaims),
  });
};

export default handler;
