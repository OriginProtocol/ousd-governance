import { FunctionComponent, useState } from "react";
import classNames from "classnames";
import Card from "components/Card";
import Ogn from "@/components/claim/education/Ogn";
import Ousd from "@/components/claim/education/Ousd";
import Ogv from "@/components/claim/education/Ogv";
import Sticky from "react-sticky-el";

interface EducationProps {
  handleNextStep: () => void;
}

const Education: FunctionComponent<EducationProps> = ({ handleNextStep }) => {
  const [currentEducationStep, setCurrentEducationStep] = useState(0);

  const handleNextEducationStep = () => {
    window && window.scrollTo(0, 0);
    setCurrentEducationStep(currentEducationStep + 1);
  };

  const educationSteps = ["OUSD", "OGN", "OGV"];

  return (
    <div className="lg:flex">
      <Sticky disabled={window.innerWidth < 768}>
        <div>
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
      </Sticky>
      <div className="mt-4 lg:mt-0">
        {currentEducationStep === 0 && (
          <Ousd onComplete={handleNextEducationStep} />
        )}
        {currentEducationStep === 1 && (
          <Ogn onComplete={handleNextEducationStep} />
        )}
        {currentEducationStep === 2 && <Ogv handleNextStep={handleNextStep} />}
      </div>
    </div>
  );
};
export default Education;
