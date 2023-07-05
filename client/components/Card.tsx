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
  className?: string;
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
  className,
}) => {
  const classes = classNames(
    "overflow-x-auto w-full rounded-lg border border-accent-content h-full",
    {
      "bg-secondary-focus text-white border-accent-content": dark && !alt,
      "bg-accent-content text-white": !dark && !alt,
      "p-4 md:p-5": tightPadding && !noPadding,
      "p-6 md:p-10": !tightPadding && !noPadding,
      "shadow-lg": !noShadow,
      "px-4 py-5 md:px-5 md:py-6": tightPadding && !noPadding && noShadow,
      "text-error": red,
      "mt-6 h-full": margin,
    },
    className
  );

  return <div className={classes}>{children}</div>;
};

export default Card;
