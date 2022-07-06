import { FunctionComponent, ReactNode } from "react";
import classNames from "classnames";

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  large?: Boolean;
  small?: Boolean;
  disabled?: Boolean;
  fullWidth?: Boolean;
  alt?: Boolean;
}

const Button: FunctionComponent<ButtonProps> = ({
  children,
  onClick,
  large,
  small,
  disabled,
  fullWidth,
  alt,
}) => {
  const className = classNames("btn rounded-full", {
    "btn-lg h-[3.25rem] min-h-[3.25rem]": large,
    "btn-sm": small,
    "w-full": fullWidth,
    "btn-primary": !alt,
    "btn-primary btn-outline": alt,
  });

  return (
    <button className={className} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
};

export default Button;
