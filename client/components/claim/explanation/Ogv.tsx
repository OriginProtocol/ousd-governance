import { FunctionComponent } from "react";
import TokenIcon from "components/TokenIcon";

interface OgvProps {}

const Ogv: FunctionComponent<OgvProps> = () => (
  <div className="space-y-4">
    <div className="flex items-center space-x-1">
      <TokenIcon src="/ogv.svg" alt="OGV" />
      <h3 className="text-lg leading-6 font-medium">OGV</h3>
    </div>
    <p className="text-sm text-gray-600">
      Origin is launching a new ERC20 token called OGV that will be the new
      governance token for Origin Dollar (OUSD).
    </p>
  </div>
);

export default Ogv;
