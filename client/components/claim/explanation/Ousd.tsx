import { FunctionComponent } from "react";
import TokenIcon from "components/TokenIcon";

interface OusdProps {}

const Ousd: FunctionComponent<OusdProps> = () => (
  <div className="space-y-4">
    <div className="flex items-center space-x-1">
      <TokenIcon src="/ousd-coin.svg" alt="OUSD" />
      <h3 className="text-lg leading-6 font-medium">OUSD</h3>
    </div>
    <p className="text-sm text-gray-600">
      Origin Dollar (OUSD) is the first stablecoin that earns a yield while it's
      still in your wallet. Access DeFi yields without any of the hassles. No
      staking. No lockups.
    </p>
  </div>
);

export default Ousd;
