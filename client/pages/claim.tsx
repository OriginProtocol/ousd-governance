import { useState } from "react";
import type { NextPage } from "next";
import Wrapper from "components/Wrapper";
import StepTracker from "components/StepTracker";
import Education from "@/components/claim/Education";
import Eligibility from "@/components/claim/Eligibility";
import Claim from "components/claim/Claim";

interface ClaimPageProps {}

const ClaimPage: NextPage<ClaimPageProps> = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const steps = ["Check eligibility", "Learn about Origin", "Claim airdrop"];

  const handleNextStep = () => setCurrentStep(currentStep + 1);
  const handlePrevStep = () => setCurrentStep(currentStep - 1);

  return (
    <div className="space-y-6">
      <Wrapper narrow>
        <StepTracker currentStep={currentStep} steps={steps} />
      </Wrapper>
      <Wrapper narrow={currentStep !== 1}>
        {currentStep == 0 && <Eligibility handleNextStep={handleNextStep} />}
        {currentStep == 1 && (
          <Education
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
