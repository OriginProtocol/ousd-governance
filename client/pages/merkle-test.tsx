import type { NextPage } from "next";
import { PageTitle } from "components/PageTitle";
import Card from "components/Card";
import useClaim from "../utils/useClaim";
import { useStore } from "utils/store";
import Wrapper from "components/Wrapper";
import { utils } from "ethers";
import { useWeb3React } from "@web3-react/core";

const MerkleTest: NextPage = () => {
  const { optional } = useClaim();
  const { account: address } = useWeb3React();
  if (!optional) {
    return <></>;
  }

  const { index, amount, proof, hasClaim, split } = optional;

  return (
    <Wrapper>
      <PageTitle>Merkle Test</PageTitle>
      <Card>
        {hasClaim ? (
          <div className="space-y-2">
            <p className="font-bold">Account is eligible to claim</p>
            <p className="underline">Claim params:</p>
            <ul>
              <li>Index: {index}</li>
              <li>Account: {address}</li>
              <li>Amount: {utils.formatUnits(amount, 18)}</li>
              <li>Proof: {JSON.stringify(proof)}</li>
            </ul>
            <p className="underline">Eligibility criteria split:</p>
            <ul>
              {Object.keys(split).map((token) => (
                <li key={token}>
                  {token}: {utils.formatUnits(split[token], 18)}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p>Account isn&apos;t eligible to claim</p>
        )}
      </Card>
    </Wrapper>
  );
};

export default MerkleTest;
