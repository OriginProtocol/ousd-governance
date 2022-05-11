import { useState } from "react";
import type { NextPage } from "next";
import Card from "components/Card";
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
      <StepTracker currentStep={currentStep} steps={steps} />
      <Card>
        {currentStep == 0 && <Explanation />}
        {currentStep == 1 && <Eligibility />}
        {currentStep == 2 && <Claim />}
      </Card>
      <StepControls
        currentStep={currentStep}
        stepControlsLabels={stepControlsLabels}
        handleNextStep={handleNextStep}
        handlePrevStep={handlePrevStep}
      />
    </div>
  );
};

export default ClaimPage;
