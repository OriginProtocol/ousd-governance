import { FunctionComponent, useState } from "react";
import classNames from "classnames";
import CardGroup from "components/CardGroup";
import Card from "components/Card";
import Button from "components/Button";
import Ogn from "@/components/claim/education/Ogn";
import Ousd from "@/components/claim/education/Ousd";
import Ogv from "@/components/claim/education/Ogv";

interface EducationProps {
  handleNextStep: () => void;
  handlePrevStep: () => void;
}

const Education: FunctionComponent<EducationProps> = ({
  handleNextStep,
  handlePrevStep,
}) => {
  const [currentEducationStep, setCurrentEducationStep] = useState(0);
  const [canAdvance, setCanAdvance] = useState(false);

  const handleNextEducationStep = () => {
    window && window.scrollTo(0, 0);
    setCurrentEducationStep(currentEducationStep + 1);
  };

  const educationSteps = [
    "Origin Dollar (OUSD)",
    "Origin Dollar Governance (OGV)",
    "Origin Story Governance (OGN)",
  ];

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-4">
        <div>
          <Card alt>
            <ul className="space-y-4">
              {educationSteps.map((step, index) => {
                const isCurrent = index === currentEducationStep;

                const markerClasses = classNames(
                  "rounded h-6 w-6 flex items-center justify-center",
                  {
                    "bg-primary text-white": isCurrent,
                    "bg-gray-300 text-gray-400": !isCurrent,
                  }
                );
                const textClasses = classNames({
                  "text-gray-500": !isCurrent,
                  "text-black": isCurrent,
                });
                return (
                  <li key={step} className="flex items-center space-x-2">
                    <span className={markerClasses}>{index + 1}</span>
                    <span className={textClasses}>{step}</span>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      </div>
      <div className="col-span-8">
        {currentEducationStep === 0 && (
          <Ousd onComplete={handleNextEducationStep} />
        )}
        {currentEducationStep === 1 && (
          <Ogv onComplete={handleNextEducationStep} />
        )}
        {currentEducationStep === 2 && <Ogn onComplete={setCanAdvance} />}
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
      </div>
    </div>
  );
};
export default Education;
