import { FunctionComponent } from "react";
import { BigNumber } from "ethers";
import numeral from "numeraljs";
import { useAccount } from "wagmi";

interface TokenAmount {
  amount: BigNumber | string | number;
  format?: string;
  isWalletBalance?: Boolean;
}

const TokenAmount: FunctionComponent<TokenAmount> = ({
  amount,
  format,
  isWalletBalance,
}) => {
  const { isConnected } = useAccount();

  const formatMap = {
    abbreviatedCurrency: "0.00 a",
    currency: "0,0.00",
    currency_no_decimals: "0,0",
    default: "0.00 a",
  };

  const usedFormat = formatMap[format] || formatMap["default"];

  if (isWalletBalance && !isConnected) {
    return <span className="uppercase">--.--</span>;
  }

  if (typeof amount == "string" || typeof amount == "number") {
    if (typeof amount == "number" && Number.isInteger(amount))
      return (
        <span className="uppercase">
          {numeral(+amount).format("0 a").trim()}
        </span>
      );

    if (typeof amount == "string")
      return (
        <span className="uppercase">
          {numeral(+amount).format("0.00 a").trim()}
        </span>
      );

    return (
      <span className="uppercase">
        {numeral(+amount).format(usedFormat).trim()}
      </span>
    );
  }

  return (
    <span className="uppercase">
      {numeral(+amount / 1e18).format(usedFormat)}
    </span>
  );
};

export default TokenAmount;
