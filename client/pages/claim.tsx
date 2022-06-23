import { useState } from "react";
import type { NextPage } from "next";
import Wrapper from "components/Wrapper";
import StepTracker from "components/StepTracker";
import Education from "@/components/claim/Education";
import Eligibility from "@/components/claim/Eligibility";
import HoldingPage from "components/holding/Page";
import Claim from "components/claim/Claim";
import { claimOpenTimestampPassed, claimIsOpen } from "utils";

interface ClaimPageProps {}

const ClaimPage: NextPage<ClaimPageProps> = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const steps = ["Check eligibility", "Learn about Origin", "Claim airdrop"];

  const handleNextStep = () => setCurrentStep(currentStep + 1);
  const handlePrevStep = () => setCurrentStep(currentStep - 1);
  const claimsTSPassed = claimOpenTimestampPassed();

  return (
    <div className="space-y-6">
      {claimsTSPassed && !claimIsOpen &&
        <Wrapper narrow>
          <HoldingPage />
        </Wrapper>
      }
      {claimsTSPassed && claimIsOpen && <>
        <Wrapper narrow>
          <StepTracker currentStep={currentStep} steps={steps} />
        </Wrapper>
        <Wrapper narrow>
          {currentStep == 0 && <Eligibility handleNextStep={handleNextStep} />}
          {currentStep == 1 && (
            <Education
              handlePrevStep={handlePrevStep}
              handleNextStep={handleNextStep}
            />
          )}
          {currentStep == 2 && <Claim handlePrevStep={handlePrevStep} />}
        </Wrapper>
      </>}
    </div>
  )
}  

export default ClaimPage;
