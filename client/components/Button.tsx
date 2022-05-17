import { FunctionComponent, ReactNode } from "react";
import classNames from "classnames";

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  large?: Boolean;
  disabled?: Boolean;
}

const Button: FunctionComponent<ButtonProps> = ({
  children,
  onClick,
  large,
  disabled,
}) => {
  const className = classNames("btn btn-primary rounded-full", {
    "btn-lg": large,
  });

  return (
    <button className={className} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
};

export default Button;
