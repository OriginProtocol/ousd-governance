import { FunctionComponent, ReactNode } from "react";
import ReactTooltip from "react-tooltip";

interface DisabledButtonToolTipProps {
  text: string;
  children: ReactNode;
  show: Boolean;
}

const DisabledButtonToolTip: FunctionComponent<DisabledButtonToolTipProps> = ({
  text,
  children,
  show,
}) => {
  if (!show) return <>{children}</>;

  return (
    <>
      <ReactTooltip
        id={text}
        place="right"
        type="light"
        effect="solid"
        borderColor="#dddddd"
        border
        className="text-left shadow-xl rounded-2xl mr-4 opaque-tooltip"
      >
        <p className="text-sm text-[#626262] py-1">{text}</p>
      </ReactTooltip>
      <div data-tip data-for={text}>
        {children}
      </div>
    </>
  );
};

export default DisabledButtonToolTip;
