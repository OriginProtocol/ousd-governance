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

const networkId = process.env.NETWORK_ID;

if (!networkId) {
  throw new Error("Set NETWORK_ID environment variable");
}

const { claims: optionalLockupClaims } = JSON.parse(
  fs.readFileSync(
    path.join(
      process.cwd(),
      `../scripts/${networkId}_data/optional_lockup_claims.json`
    ),
    "utf8"
  )
);

const { claims: mandatoryLockupClaims } = JSON.parse(
  fs.readFileSync(
    path.join(
      process.cwd(),
      `../scripts/${networkId}_data/mandatory_lockup_claims.json`
    ),
    "utf8"
  )
);

if (!optionalLockupClaims || !mandatoryLockupClaims) {
  throw new Error("Generate claims files");
}

const handler = (req: NextApiRequest, res: NextApiResponse<Data>) => {
  const account: string = (req.query.account as string) || "";
  if (!account)
    return res.status(500).json({ error: "Missing account parameter" });

  const optionalLockupClaim = optionalLockupClaims[account];
  const mandatoryLockupClaim = mandatoryLockupClaims[account];

  const claim = {
    hasClaim: !!(optionalLockupClaim || mandatoryLockupClaim),
    optionalLockupClaim: optionalLockupClaim || {},
    mandatoryLockupClaim: mandatoryLockupClaim || {},
  };

  return res.status(200).json(claim);
};

export default handler;
