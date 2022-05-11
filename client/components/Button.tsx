import { FunctionComponent, ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
}

const Button: FunctionComponent<ButtonProps> = ({ children, onClick }) => (
  <button className="btn btn-primary rounded-full" onClick={onClick}>
    {children}
  </button>
);

export default Button;
