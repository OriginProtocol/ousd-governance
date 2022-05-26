import type { NextPage } from "next";
import { PageTitle } from "components/PageTitle";
import Card from "components/Card";
import useClaim from "../utils/useClaim";
import { useStore } from "utils/store";

const MerkleTest: NextPage = () => {
  const claim = useClaim();
  const { index, amount, proof, hasClaim, split } = claim;
  const { address } = useStore();

  return (
    <>
      <PageTitle>Merkle Test</PageTitle>
      <Card>
        {hasClaim ? (
          <div className="space-y-2">
            <p className="font-bold">Account is eligible to claim</p>
            <p className="underline">Claim params:</p>
            <ul>
              <li>Index: {index}</li>
              <li>Account: {address}</li>
              <li>Amount: {amount}</li>
              <li>Proof: {JSON.stringify(proof)}</li>
            </ul>
            <p className="underline">Eligibility criteria split:</p>
            <ul>
              {Object.keys(split).map((token) => (
                <li key={token}>
                  {token}: {split[token]}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p>Account isn&apos;t eligible to claim</p>
        )}
      </Card>
    </>
  );
};

export default MerkleTest;
