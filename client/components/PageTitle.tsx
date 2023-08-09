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
    <h1 className="text-[40px] text-white mt-6 font-bold font-header">
      {children}
    </h1>
  </div>
);
