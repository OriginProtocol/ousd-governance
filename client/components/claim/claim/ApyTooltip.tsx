import { FunctionComponent } from "react";
import ReactTooltip from "react-tooltip";
import Icon from "@mdi/react";
import { mdiAlertCircle } from "@mdi/js";

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
          The variable APY indicates the addtional OGV that you would receive
          over time based on the current number of stakers and inflation
          schedule. This yield will change as more users stake and OUSD grows.
        </p>
      </ReactTooltip>
      <div>
        <div
          data-tip
          data-for="variable-apy"
          className="inline-flex space-x-1 items-center sm:justify-end w-auto mb-2"
        >
          <span className="text-sm">Variable APY</span>
          <Icon
            path={mdiAlertCircle}
            size={0.75}
            className="text-secondary mx-auto"
          />
        </div>
      </div>
    </>
  );
};

export default ApyToolTip;
