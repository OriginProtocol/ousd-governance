import { FunctionComponent, ReactNode } from "react";
import classNames from "classnames";

interface WrapperProps {
  children: ReactNode;
  narrow?: Boolean;
}

const Wrapper: FunctionComponent<WrapperProps> = ({ children, narrow }) => {
  const classes = classNames("w-full mx-auto px-4 md:px-6", {
    "max-w-2xl": narrow,
    "max-w-2xl lg:max-w-6xl": !narrow,
  });

  return <div className={classes}>{children}</div>;
};

export default Wrapper;
