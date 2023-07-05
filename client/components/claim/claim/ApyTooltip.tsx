import { FunctionComponent } from "react";
import ReactTooltip from "react-tooltip";
import Icon from "@mdi/react";
import { mdiInformationOutline as InfoIcon } from "@mdi/js";

interface ApyToolTipProps {}

const ApyToolTip: FunctionComponent<ApyToolTipProps> = () => {
  return (
    <>
      <ReactTooltip
        id="variable-apy"
        place="right"
        type="light"
        effect="solid"
        borderColor="#dddddd"
        border
        className="text-left shadow-xl rounded-2xl w-[230px] mr-4 opaque-tooltip"
      >
        <p className="text-sm text-[#626262] py-3">
          The variable APY indicates the percentage of additional OGV that you
          would receive over time based on the current number of stakers and
          inflation schedule. This yield will change as more users stake and
          OUSD grows.
        </p>
      </ReactTooltip>
      <div>
        <div
          data-tip
          data-for="variable-apy"
          className="inline-flex space-x-1 items-center sm:justify-end w-auto mb-2"
        >
          <span className="text-sm text-neutral">Variable APY</span>
          <Icon path={InfoIcon} size={0.75} className="text-neutral mx-auto" />
        </div>
      </div>
    </>
  );
};

export default ApyToolTip;
