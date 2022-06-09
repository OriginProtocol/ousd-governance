import { FunctionComponent, ReactNode } from "react";
import classNames from "classnames";

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  large?: Boolean;
  small?: Boolean;
  disabled?: Boolean;
  fullWidth?: Boolean;
}

const Button: FunctionComponent<ButtonProps> = ({
  children,
  onClick,
  large,
  small,
  disabled,
  fullWidth,
}) => {
  const className = classNames("btn btn-primary rounded-full", {
    "btn-lg": large,
    "btn-sm": small,
    "w-full": fullWidth,
  });

  return (
    <button className={className} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
};

export default Button;
