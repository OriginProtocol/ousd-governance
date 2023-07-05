import classnames from "classnames";
import { ReactNode } from "react";

type StateBadgeProps = {
  className: string;
  children: ReactNode;
};

const StateBadge = ({ className, children }: StateBadgeProps) => (
  <span
    className={classnames(
      "badge text-[12px] font-bold text-primary-content font-primary border-none",
      className
    )}
  >
    {children}
  </span>
);

export const StateTag = ({ state }: { state: number }) => {
  return (
    <>
      {state == 0 && <StateBadge className="badge-info">Pending</StateBadge>}
      {state == 1 && <StateBadge className="badge-warning">Active</StateBadge>}
      {state == 2 && <StateBadge className="badge-error">Cancelled</StateBadge>}
      {state == 3 && <StateBadge className="badge-error">Defeated</StateBadge>}
      {state == 4 && <StateBadge className="badge-error">Succeeded</StateBadge>}
      {state == 5 && <StateBadge className="badge-success">Queued</StateBadge>}
      {state == 6 && <StateBadge className="badge-success">Expired</StateBadge>}
      {state == 7 && (
        <StateBadge className="badge-success">Executed</StateBadge>
      )}
    </>
  );
};
