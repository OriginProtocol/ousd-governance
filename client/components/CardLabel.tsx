import { FunctionComponent, ReactNode } from "react";

interface CardLabelProps {
  children: ReactNode;
}

const CardLabel: FunctionComponent<CardLabelProps> = ({ children }) => (
  <div className="text-sm text-[#8293a4]">{children}</div>
);

export default CardLabel;
