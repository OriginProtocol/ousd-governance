import { FunctionComponent, ReactNode } from "react";

interface WrapperProps {
  children: ReactNode;
}

const Wrapper: FunctionComponent<WrapperProps> = ({ children }) => (
  <div className="w-full max-w-7xl mx-auto px-4 md:px-6">{children}</div>
);

export default Wrapper;
