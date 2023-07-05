import { FunctionComponent, ReactNode } from "react";
import classNames from "classnames";

interface CardDescription {
  children: ReactNode;
  alt?: Boolean;
  large?: Boolean;
}

const CardDescription: FunctionComponent<CardDescription> = ({
  children,
  alt,
  large,
}) => {
  const classes = classNames("text-xs text-neutral", {
    "text-base": large,
  });

  return <div className={classes}>{children}</div>;
};

export default CardDescription;
