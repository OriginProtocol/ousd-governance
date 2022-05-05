import { FunctionComponent, ReactNode } from "react";

interface CardStatProps {
  children: ReactNode;
}

const CardStat: FunctionComponent<CardStatProps> = ({ children }) => (
  <div className="text-2xl whitespace-nowrap">{children}</div>
);

export default CardStat;
