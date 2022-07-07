import { FunctionComponent, ReactNode } from "react";

interface CardStatProps {
  children: ReactNode;
  large?: Boolean;
}

const CardStat: FunctionComponent<CardStatProps> = ({ children, large }) => (
  <div
    className={
      large ? "text-4xl whitespace-nowrap" : "text-2xl whitespace-nowrap"
    }
  >
    {children}
  </div>
);

export default CardStat;
