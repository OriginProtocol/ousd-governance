import { FunctionComponent, ReactNode } from "react";
import classNames from "classnames";

interface CardProps {
  children: ReactNode;
  dark?: Boolean;
  tightPadding?: Boolean;
  noPadding?: Boolean;
}

const Card: FunctionComponent<CardProps> = ({
  children,
  dark,
  tightPadding,
  noPadding,
}) => {
  const classes = classNames("w-full shadow-lg rounded-lg border", {
    "bg-secondary-focus text-white border-black": dark,
    "bg-white text-black": !dark,
    "p-4 md:p-5": tightPadding && !noPadding,
    "p-6 md:p-10": !tightPadding && !noPadding,
  });

  return <div className={classes}>{children}</div>;
};

export default Card;
