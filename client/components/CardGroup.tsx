import { FunctionComponent, ReactNode } from "react";
import classNames from "classnames";

interface CardGroupProps {
  children: ReactNode;
  horizontal?: Boolean;
  fourCol?: Boolean;
}

const CardGroup: FunctionComponent<CardGroupProps> = ({
  children,
  horizontal,
  fourCol,
}) => {
  const classes = classNames("w-full", {
    "grid gap-2": horizontal,
    "space-y-5": !horizontal,
    "sm:grid-cols-4": fourCol,
    "sm:grid-cols-3": !fourCol,
  });

  return <div className={classes}>{children}</div>;
};

export default CardGroup;
