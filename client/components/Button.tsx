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
  white?: Boolean;
  black?: Boolean;
  red?: Boolean;
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
  black,
  red,
}) => {
  const className = classNames("btn rounded-full normal-case space-x-2", {
    "btn-lg h-[3.25rem] min-h-[3.25rem]": large,
    "btn-sm": small,
    "w-full": fullWidth,
    "btn-primary": !alt,
    "btn-primary btn-outline disabled:border-gray-100 disabled:text-gray-300":
      alt,
    "bg-white hover:bg-gray-100 active:bg-gray-100 focus:bg-gray-100 text-accent":
      white,
    "bg-black text-white border-black hover:bg-gray-900 hover:border-gray-900":
      black,
    "bg-[#dd0a0a] border-[#dd0a0a] hover:bg-[#f52424] hover:border-[#f52424]":
      red,
  });

  return (
    <button className={className} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
};

export default Button;
