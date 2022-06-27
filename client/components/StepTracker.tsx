import { FunctionComponent } from "react";

interface StepTrackerProps {
  currentStep: number;
  steps: Array<string>;
}

const StepTracker: FunctionComponent<StepTrackerProps> = ({
  currentStep,
  steps,
}) => (
  <ul className="steps w-full text-white">
    {steps.map((step, index) => (
      <li
        key={index}
        className={currentStep >= index ? "step step-primary" : "step"}
      >
        {step}
      </li>
    ))}
  </ul>
);

export default StepTracker;
