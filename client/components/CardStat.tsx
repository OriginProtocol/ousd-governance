import { FunctionComponent, ReactNode } from "react";
import classnames from "classnames";

interface CardStatProps {
  children: ReactNode;
  large?: Boolean;
  small?: Boolean;
}

const CardStat: FunctionComponent<CardStatProps> = ({
  children,
  large,
  small,
}) => (
  <div
    className={classnames(
      "font-header",
      large
        ? "text-4xl whitespace-nowrap"
        : small
        ? "text-xl whitespace-nowrap"
        : "text-2xl whitespace-nowrap"
    )}
  >
    {children}
  </div>
);

export default CardStat;
