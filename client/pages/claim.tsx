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
  const steps = ["Explanation", "Eligibility", "Claim"];
  const stepControlsLabels = [
    "Read explanation",
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
      <Wrapper narrow={currentStep !== 2}>
        {currentStep == 0 && <Explanation />}
        {currentStep == 1 && <Eligibility />}
        {currentStep == 2 && <Claim />}
        <div className="mt-5">
          <StepControls
            currentStep={currentStep}
            stepControlsLabels={stepControlsLabels}
            handleNextStep={handleNextStep}
            handlePrevStep={handlePrevStep}
          />
        </div>
      </Wrapper>
    </div>
  );
};

export default ClaimPage;
