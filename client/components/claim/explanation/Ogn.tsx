import { FunctionComponent } from "react";
import TokenIcon from "components/TokenIcon";

interface OgnProps {}

const Ogn: FunctionComponent<OgnProps> = () => (
  <div className="space-y-4">
    <div className="flex items-center space-x-1">
      <TokenIcon src="/ogn-coin.svg" alt="OGN" />
      <h3 className="text-lg leading-6 font-medium">OGN</h3>
    </div>
    <p className="text-sm text-gray-600">
      Origin Token (OGN) allows you to own a stake in the Origin ecosystem. Buy
      OGN to participate in governance and growth of the network.
    </p>
  </div>
);

export default Ogn;
