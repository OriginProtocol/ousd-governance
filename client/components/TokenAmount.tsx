import { FunctionComponent, ReactNode } from "react";
import { BigNumber } from "ethers";
import numeral from "numeraljs";

interface TokenAmount {
  amount: BigNumber | string | number;
}

const TokenAmount: FunctionComponent<TokenAmount> = ({ amount }) => {
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
      .format("0.00 a")
      .trim();
  }

  return numeral(+amount / 1e18).format("0.00 a");
};

export default TokenAmount;
