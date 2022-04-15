import { FunctionComponent, ReactNode } from "react";
import classNames from "classnames";

interface CardProps {
  children: ReactNode;
  dark?: Boolean;
  tightPadding?: Boolean;
}

const Card: FunctionComponent<CardProps> = ({
  children,
  dark,
  tightPadding,
}) => {
  const classes = classNames("w-full shadow-lg rounded-lg border", {
    "bg-neutral-content text-white border-black": dark,
    "bg-white text-black": !dark,
    "p-5": tightPadding,
    "p-10": !tightPadding,
  });

  return <div className={classes}>{children}</div>;
};

export default Card;
