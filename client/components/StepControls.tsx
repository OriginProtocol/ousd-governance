import { FunctionComponent } from "react";
import Button from "components/Button";

interface StepControlsProps {
  currentStep: number;
  stepControlsLabels: Array<string>;
  handleNextStep: () => void;
  handlePrevStep: () => void;
}

const StepControls: FunctionComponent<StepControlsProps> = ({
  currentStep,
  stepControlsLabels,
  handlePrevStep,
  handleNextStep,
}) => (
  <div className="flex items-center justify-between">
    {stepControlsLabels[currentStep - 1] !== undefined && (
      <div className="mr-auto">
        <Button onClick={handlePrevStep}>
          &larr; {stepControlsLabels[currentStep - 1]}
        </Button>
      </div>
    )}
    {stepControlsLabels[currentStep + 1] !== undefined && (
      <div className="ml-auto">
        <Button onClick={handleNextStep}>
          {stepControlsLabels[currentStep + 1]} &rarr;
        </Button>
      </div>
    )}
  </div>
);

export default StepControls;
