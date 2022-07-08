import { useState, useEffect } from "react";
import type { NextPage } from "next";
import Wrapper from "components/Wrapper";
import StepTracker from "components/StepTracker";
import Education from "@/components/claim/Education";
import Eligibility from "@/components/claim/Eligibility";
import HoldingPage from "components/holding/Page";
import Claim from "components/claim/Claim";
import { useStore } from "utils/store";
import { claimOpenTimestampPassed, claimIsOpen } from "utils";

interface ClaimPageProps {}

const ClaimPage: NextPage<ClaimPageProps> = () => {
  const { claim } = useStore();
  const { currentStep } = claim;

  const updateCurrentStep = (stepChange) => {
    useStore.setState({
      claim: {
        ...claim,
        currentStep: currentStep + stepChange
      }
    });
  }
  const steps = ["Check Eligibility", "Learn about Origin", "Claim Airdrop"];

  const handleNextStep = () => updateCurrentStep(+1);
  const handlePrevStep = () => updateCurrentStep(-1);

  const [claimOpenTsPassed, setClaimOpenTsPassed] = useState(
    claimOpenTimestampPassed()
  );
  const [claimOpen, setClaimOpen] = useState(claimIsOpen());

  useEffect(() => {
    // check every second so component re-renders when counter reaches 0
    const claimOpensTimer = setInterval(() => {
      setClaimOpenTsPassed(claimOpenTimestampPassed());
      setClaimOpen(claimIsOpen());
    }, 1000);

    return () => {
      clearInterval(claimOpensTimer);
    };
  }, []);
  
  return (
    <div className="space-y-6">
      {!claimOpenTsPassed && (
        <Wrapper narrow>
          <HoldingPage />
        </Wrapper>
      )}
      {claimOpen && (
        <>
          <Wrapper narrow>
            <StepTracker currentStep={currentStep} steps={steps} />
          </Wrapper>
          <Wrapper narrow>
            {currentStep == 0 && (
              <Eligibility handleNextStep={handleNextStep} />
            )}
            {currentStep == 1 && <Education handleNextStep={handleNextStep} />}
            {currentStep == 2 && <Claim handlePrevStep={handlePrevStep} />}
          </Wrapper>
        </>
      )}
    </div>
  );
};

export default ClaimPage;
