import { FunctionComponent, ReactNode } from "react";
import classNames from "classnames";

interface CardProps {
  children: ReactNode;
  dark?: Boolean;
  tightPadding?: Boolean;
  noPadding?: Boolean;
  alt?: Boolean;
}

const Card: FunctionComponent<CardProps> = ({
  children,
  dark,
  tightPadding,
  noPadding,
  alt,
}) => {
  const classes = classNames(
    "overflow-x-auto w-full shadow-lg rounded-lg border h-full",
    {
      "bg-secondary-focus text-white border-black": dark && !alt,
      "bg-white text-black": !dark && !alt,
      "p-4 md:p-5": tightPadding && !noPadding,
      "p-6 md:p-10": !tightPadding && !noPadding,
      "bg-gray-100": alt && !dark,
    }
  );

  return <div className={classes}>{children}</div>;
};

export default Card;
