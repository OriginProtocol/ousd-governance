import { FunctionComponent, ReactNode } from "react";

interface CardDescription {
  children: ReactNode;
}

const CardDescription: FunctionComponent<CardDescription> = ({ children }) => (
  <div className="text-xs text-[#8293a4]">{children}</div>
);

export default CardDescription;
