import { FunctionComponent } from "react";

interface StepTrackerProps {
  currentStep: number;
  steps: Array<string>;
}

const StepTracker: FunctionComponent<StepTrackerProps> = ({
  currentStep,
  steps,
}) => (
  <div className="space-y-5">
    <h1 className="text-2xl text-white">
      Step {currentStep + 1}:{" "}
      <span className="text-accent">{steps[currentStep]}</span>
    </h1>
    <div className="relative">
      <div className="bg-black w-full h-[6px]" />
      {currentStep >= 1 && (
        <div className="bg-accent w-1/2 h-[6px] -mt-[6px] border border-black" />
      )}
      {currentStep >= 2 && (
        <div className="bg-accent w-full h-[6px] -mt-[6px] border border-black" />
      )}
      <ul className="w-full flex items-between -mt-3 text-sm text-[#8293a4]">
        <li className="flex-1 space-y-2">
          <span
            className={
              currentStep >= 0
                ? "h-5 w-5 rounded-full bg-accent block border border-black -ml-1"
                : "h-5 w-5 rounded-full bg-black block border border-black -ml-1"
            }
          />
          <span
            className={
              currentStep == 0 ? "inline-block text-accent" : "inline-block"
            }
          >
            Check Eligibility
          </span>
        </li>
        <li className="flex-1 space-y-2 text-center">
          <span
            className={
              currentStep >= 1
                ? "h-5 w-5 rounded-full bg-accent block mx-auto border border-black"
                : "h-5 w-5 rounded-full bg-black block mx-auto border border-black"
            }
          />
          <span
            className={
              currentStep == 1 ? "inline-block text-accent" : "inline-block"
            }
          >
            Learn about Origin
          </span>
        </li>
        <li className="flex-1 space-y-2 text-right">
          <span
            className={
              currentStep >= 2
                ? "h-5 w-5 rounded-full bg-accent block ml-auto border border-black -mr-1"
                : "h-5 w-5 rounded-full bg-black block ml-auto border border-black -mr-1"
            }
          />
          <span
            className={
              currentStep == 2 ? "inline-block text-accent" : "inline-block"
            }
          >
            Claim Airdrop
          </span>
        </li>
      </ul>
    </div>
  </div>
);

export default StepTracker;
