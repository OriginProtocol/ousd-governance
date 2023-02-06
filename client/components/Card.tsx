import { FunctionComponent, ReactNode } from "react";
import classNames from "classnames";

interface CardProps {
  children: ReactNode;
  dark?: Boolean;
  tightPadding?: Boolean;
  noPadding?: Boolean;
  alt?: Boolean;
  noShadow?: Boolean;
  red?: Boolean;
  margin?: Boolean;
}

const Card: FunctionComponent<CardProps> = ({
  children,
  dark,
  tightPadding,
  noPadding,
  alt,
  noShadow,
  red,
  margin,
}) => {
  const classes = classNames(
    "overflow-x-auto w-full rounded-lg border h-full",
    {
      "bg-secondary-focus text-white border-black": dark && !alt,
      "bg-white text-black": !dark && !alt,
      "p-4 md:p-5": tightPadding && !noPadding,
      "p-6 md:p-10": !tightPadding && !noPadding,
      "bg-gray-100": alt && !dark,
      "shadow-lg": !noShadow,
      "px-4 py-5 md:px-5 md:py-6": tightPadding && !noPadding && noShadow,
      "bg-[#dd0a0a1a] border-[#dd0a0a] text-[#dd0a0a]": red,
      "mt-6 h-full": margin,
    }
  );

  return <div className={classes}>{children}</div>;
};

export default Card;
