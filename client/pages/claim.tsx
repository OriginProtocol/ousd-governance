import { useState } from "react";
import type { NextPage } from "next";
import Wrapper from "components/Wrapper";
import StepTracker from "components/StepTracker";
import StepControls from "components/StepControls";
import Explanation from "components/claim/Explanation";
import Eligibility from "@/components/claim/Eligibility";
import Claim from "components/claim/Claim";

interface ClaimPageProps {}

const ClaimPage: NextPage<ClaimPageProps> = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const steps = ["Origin Products", "Eligibility", "Claim"];
  const stepControlsLabels = [
    "Learn about Origin products",
    "Check your eligibility",
    "Claim your tokens",
  ];

  const handleNextStep = () => setCurrentStep(currentStep + 1);
  const handlePrevStep = () => setCurrentStep(currentStep - 1);

  return (
    <div className="space-y-6">
      <Wrapper narrow>
        <StepTracker currentStep={currentStep} steps={steps} />
      </Wrapper>
      <Wrapper narrow>
        {currentStep == 0 && <Explanation handleNextStep={handleNextStep} />}
        {currentStep == 1 && (
          <Eligibility
            handlePrevStep={handlePrevStep}
            handleNextStep={handleNextStep}
          />
        )}
        {currentStep == 2 && <Claim handlePrevStep={handlePrevStep} />}
      </Wrapper>
    </div>
  );
};

export default ClaimPage;
