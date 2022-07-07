import { FunctionComponent, ReactNode } from "react";
import classNames from "classnames";

interface CardGroupProps {
  children: ReactNode;
  horizontal?: Boolean;
  twoCol?: Boolean;
  fourCol?: Boolean;
  dontStackOnMobile?: Boolean;
}

const CardGroup: FunctionComponent<CardGroupProps> = ({
  children,
  horizontal,
  twoCol,
  fourCol,
  dontStackOnMobile,
}) => {
  const classes = classNames("w-full relative", {
    "grid gap-2": horizontal,
    "space-y-5": !horizontal,
    "sm:grid-cols-2": twoCol,
    "sm:grid-cols-4": fourCol,
    "sm:grid-cols-3": !twoCol && !fourCol,
    "grid-cols-2": twoCol && dontStackOnMobile,
    "grid-cols-4": fourCol && dontStackOnMobile,
    "grid-cols-3": !twoCol && !fourCol && dontStackOnMobile,
  });

  return <div className={classes}>{children}</div>;
};

export default CardGroup;
