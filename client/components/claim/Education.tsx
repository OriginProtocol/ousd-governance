import { FunctionComponent, useState } from "react";
import { StickyContainer, Sticky } from "react-sticky";
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

  const educationSteps = ["OUSD", "OGN", "OGV"];

  return (
    <div className="lg:flex">
      <StickyContainer>
        <Sticky>
          {({ style }) => (
            <div style={style}>
              <div className="lg:w-40 lg:-ml-44 xl:w-56 xl:-ml-60 lg:z-10 lg:pt-4">
                <Card tightPadding alt>
                  <ul className="space-y-2 md:space-y-4">
                    {educationSteps.map((step, index) => {
                      const isCurrent = index === currentEducationStep;

                      const markerClasses = classNames(
                        "text-sm md:text-base rounded h-6 w-6 flex flex-shrink-0 items-center justify-center",
                        {
                          "bg-primary text-white": isCurrent,
                          "bg-gray-300 text-gray-400": !isCurrent,
                        }
                      );
                      const textClasses = classNames("text-sm md:text-base", {
                        "text-gray-500": !isCurrent,
                        "text-black": isCurrent,
                      });
                      return (
                        <li
                          key={step}
                          className="flex items-center space-x-2 lg:space-x-3"
                        >
                          <span className={markerClasses}>{index + 1}</span>
                          <span className={textClasses}>{step}</span>
                        </li>
                      );
                    })}
                  </ul>
                </Card>
              </div>
            </div>
          )}
        </Sticky>
      </StickyContainer>
      <div className="mt-4 lg:mt-0">
        {currentEducationStep === 0 && (
          <Ousd onComplete={handleNextEducationStep} />
        )}
        {currentEducationStep === 1 && (
          <Ogn onComplete={handleNextEducationStep} />
        )}
        {currentEducationStep === 2 && <Ogv onComplete={setCanAdvance} />}
        <div className="mt-6 flex">
          <div className="mr-auto">
            <Button onClick={handlePrevStep} alt>
              &larr; Check eligibility
            </Button>
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
