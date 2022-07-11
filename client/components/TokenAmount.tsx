import { FunctionComponent, ReactNode } from "react";
import { BigNumber } from "ethers";
import numeral from "numeraljs";

interface TokenAmount {
  amount: BigNumber | string | number;
  format?: string;
}

const TokenAmount: FunctionComponent<TokenAmount> = ({ amount, format }) => {
  const formatMap = {
    abbreviatedCurrency: "0.00 a",
    currency: "0,0.00",
    default: "0.00 a",
  };

  const usedFormat = formatMap[format] || formatMap["default"];

  if (typeof amount == "string" || typeof amount == "number") {
    if (typeof amount == "number" && Number.isInteger(amount))
      return numeral(+amount)
        .format("0 a")
        .trim();

    if (typeof amount == "string")
      return numeral(+amount)
        .format("0 a")
        .trim();

    return numeral(+amount)
      .format(usedFormat)
      .trim();
  }

  return numeral(+amount / 1e18).format(usedFormat);
};

export default TokenAmount;
