import { FunctionComponent, ReactNode } from "react";

interface CardGroupProps {
  children: ReactNode;
}

const CardGroup: FunctionComponent<CardGroupProps> = ({ children }) => (
  <div className="space-y-5">{children}</div>
);

export default CardGroup;
