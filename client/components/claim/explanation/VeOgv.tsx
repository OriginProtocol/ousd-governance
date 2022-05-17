import { FunctionComponent } from "react";
import TokenIcon from "components/TokenIcon";

interface VeOgvProps {}

const VeOgv: FunctionComponent<VeOgvProps> = () => (
  <div className="space-y-4">
    <div className="flex items-center space-x-1">
      <TokenIcon src="/veogv.svg" alt="veOGV" />
      <h3 className="text-lg leading-6 font-medium">veOGV</h3>
    </div>
    <p className="text-sm text-gray-600">
      The veOGV mechanism distributes economic and voting power to those most
      committed to the long-term success of the protocol. veOGV stakers will be
      able to set fees as a percentage of yield, determine asset allocation and
      propose new strategies.
    </p>
  </div>
);

export default VeOgv;
