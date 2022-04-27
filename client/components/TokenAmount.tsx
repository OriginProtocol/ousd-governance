import { FunctionComponent, ReactNode } from "react";
import { BigNumber } from "ethers";
import numeral from "numeraljs";

interface TokenAmount {
  amount: BigNumber;
}

const TokenAmount: FunctionComponent<TokenAmount> = ({ amount }) => {
  return <div>{numeral(+amount / 1e18).format("0 a")}</div>;
};

export default TokenAmount;
