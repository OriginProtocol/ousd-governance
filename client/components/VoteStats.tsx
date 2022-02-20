import numeral from "numeraljs";

export const VoteStats = ({
  proposalCount,
  holderCount,
  totalSupply,
}: {
  proposalCount: number | undefined;
  holderCount: number;
  totalSupply: number;
}) => {
  return (
    <div className="w-full shadow stats">
      <div className="stat">
        <div className="stat-figure text-primary">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
        </div>
        <div className="stat-title">Proposals</div>
        <div className="stat-value text-primary">{proposalCount}</div>
      </div>
      <div className="stat">
        <div className="stat-figure text-info-content">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <div className="stat-title">Vote Supply</div>
        <div className="stat-value text-info-content">
          {numeral(totalSupply / 1e18).format("0 a")}
        </div>
      </div>
      <div className="stat">
        <div className="stat-figure text-success-content">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        </div>
        <div className="stat-title">Vote Addresses</div>
        <div className="stat-value text-success-content">{holderCount}</div>
      </div>
    </div>
  );
};
