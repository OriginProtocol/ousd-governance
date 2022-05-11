import { FunctionComponent, ReactNode } from "react";
import classNames from "classnames";

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  large?: Boolean;
}

const Button: FunctionComponent<ButtonProps> = ({
  children,
  onClick,
  large,
}) => {
  const className = classNames("btn btn-primary rounded-full", {
    "btn-lg": large,
  });

  return (
    <button className={className} onClick={onClick}>
      {children}
    </button>
  );
};

export default Button;
