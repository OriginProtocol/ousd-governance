import { FunctionComponent } from "react";
import { utils, BigNumber } from "ethers";
import TokenIcon from "components/TokenIcon";
import CheckIcon from "components/CheckIcon";
import ReactTooltip from "react-tooltip";
import { formatCurrency } from "utils/math";

interface EligibilityItemProps {
  id: string;
  itemTitle: string;
  tokens?: BigNumber;
  showOgvToken: Boolean;
  isTotal?: Boolean;
}

const EligibilityItem: FunctionComponent<EligibilityItemProps> = ({
  id,
  itemTitle,
  tokens,
  showOgvToken,
  isTotal,
}) => {
  tokens = tokens || BigNumber.from(0);
  const isEligible = tokens.gt(0);

  if (!isEligible) {
    return <></>;
  }

  return (
    <>
      <tr
        className={
          isTotal
            ? "flex flex-col sm:table-row items-center py-3 space-y-2 bg-primary text-white"
            : "flex flex-col sm:table-row items-center py-3 space-y-2"
        }
      >
        <td className="p-0 sm:p-4">
          <div className="flex space-x-2 items-center">
            {!isTotal && <CheckIcon />}
            <span className={isTotal ? "font-bold pl-7" : ""}>{itemTitle}</span>
          </div>
        </td>
        <td className="p-0 sm:p-4">
          <div className="flex space-x-2 items-center">
            <TokenIcon
              src={showOgvToken ? "/ogv.svg" : "/veogv.svg"}
              alt={showOgvToken ? "OGV" : "veOGV"}
            />
            <ReactTooltip id={id} place="top" type="dark" effect="solid">
              <span>
                <span className="mr-1">{utils.formatUnits(tokens, 18)}</span>
                {showOgvToken ? "OGV" : "veOGV"}
              </span>
            </ReactTooltip>
            <div data-tip data-for={id} className={isTotal ? "font-bold" : ""}>
              <span>
                <span className="mr-1">
                  {formatCurrency(utils.formatUnits(tokens, 18))}
                </span>
                {showOgvToken ? "OGV" : "veOGV"}
              </span>
            </div>
          </div>
        </td>
      </tr>
    </>
  );
};

export default EligibilityItem;
