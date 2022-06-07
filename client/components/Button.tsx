import { FunctionComponent, ReactNode } from "react";
import classNames from "classnames";

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  large?: Boolean;
  disabled?: Boolean;
  fullWidth?: Boolean;
}

const Button: FunctionComponent<ButtonProps> = ({
  children,
  onClick,
  large,
  disabled,
  fullWidth,
}) => {
  const className = classNames("btn btn-primary rounded-full", {
    "btn-lg": large,
    "w-full": fullWidth,
  });

  return (
    <button className={className} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
};

export default Button;
