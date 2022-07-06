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
  white,
}) => {
  const className = classNames("btn rounded-full normal-case", {
    "btn-lg h-[3.25rem] min-h-[3.25rem]": large,
    "btn-sm": small,
    "w-full": fullWidth,
    "btn-primary": !alt,
    "btn-primary btn-outline": alt,
    "bg-white hover:bg-gray-100 active:bg-gray-100 focus:bg-gray-100 text-accent":
      white,
  });

  return (
    <button className={className} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
};

export default Button;
