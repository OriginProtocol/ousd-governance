import { FunctionComponent, useState } from "react";
import Card from "components/Card";
import Button from "components/Button";
import Ogn from "@/components/claim/education/Ogn";
import Ousd from "@/components/claim/education/Ousd";
import Ogv from "@/components/claim/education/Ogv";

interface ExplanationProps {
  handleNextStep: () => void;
  handlePrevStep: () => void;
}

const Explanation: FunctionComponent<ExplanationProps> = ({
  handleNextStep,
  handlePrevStep,
}) => {
  const canAdvance = true;

  return (
    <>
      <Card>
        <div className="space-y-8">
          <Ousd />
          <Ogv />
          <Ogn />
        </div>
      </Card>
      <div className="mt-6 flex">
        <div className="mr-auto">
          <Button onClick={handlePrevStep}>&larr; Check eligibility</Button>
        </div>
        <div className="ml-auto">
          <Button onClick={handleNextStep} disabled={!canAdvance}>
            Claim airdrop &rarr;
          </Button>
        </div>
      </div>
    </>
  );
};
export default Explanation;
