import { FunctionComponent, ReactNode } from "react";

interface PageTitleProps {
  children: ReactNode;
  noBottomMargin?: Boolean;
}

export const PageTitle: FunctionComponent<PageTitleProps> = ({
  children,
  noBottomMargin,
}) => (
  <div className={noBottomMargin ? "" : "pb-5"}>
    <h1 className="text-2xl text-white">{children}</h1>
  </div>
);
