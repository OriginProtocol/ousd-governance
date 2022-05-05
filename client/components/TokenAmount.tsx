import { FunctionComponent, ReactNode } from "react";
import { BigNumber } from "ethers";
import numeral from "numeraljs";

interface TokenAmount {
  amount: BigNumber | string | number;
}

const TokenAmount: FunctionComponent<TokenAmount> = ({ amount }) => {
  if (typeof amount == "string" || typeof amount == "number") {
    return numeral(+amount).format("0 a");
  }

  return numeral(+amount / 1e18).format("0 a");
};

export default TokenAmount;
