import ActiveLink from "../components/ActiveLink";

export default function Layout({ children }) {
  const activeClass =
    "bg-indigo-800 text-white group flex items-center px-2 py-2 text-sm font-medium rounded-md";
  const inactiveClass =
    "text-indigo-100 hover:bg-indigo-600 group flex items-center px-2 py-2 text-sm font-medium rounded-md";

  return (
    <div>
      <div
        className="fixed inset-0 flex z-40 md:hidden"
        role="dialog"
        aria-modal="true"
      >
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75"
          aria-hidden="true"
        />
        <div className="relative flex-1 flex flex-col max-w-xs w-full pt-5 pb-4 bg-indigo-700">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            >
              <span className="sr-only">Close sidebar</span>
              <svg
                className="h-6 w-6 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="flex-shrink-0 flex items-center px-4">
            <div className="flex items-center flex-shrink-0 px-4 text-white font-semibold">
              OUSD Governance
            </div>
          </div>
          <div className="mt-5 flex-1 h-0 overflow-y-auto">
            <nav className="px-2 space-y-1">
              <ActiveLink
                href="/"
                activeClassName={activeClass}
                inactiveClassName={inactiveClass}
              >
                <a>Overview</a>
              </ActiveLink>
              <ActiveLink
                href="/proposal"
                activeClassName={activeClass}
                inactiveClassName={inactiveClass}
              >
                <a>Proposals</a>
              </ActiveLink>
              <ActiveLink
                href="/leaderboard"
                activeClassName={activeClass}
                inactiveClassName={inactiveClass}
              >
                <a>Leaderboard</a>
              </ActiveLink>
            </nav>
          </div>
        </div>
        <div className="flex-shrink-0 w-14" aria-hidden="true" />
      </div>

      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex flex-col flex-grow pt-5 bg-indigo-700 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4 text-white font-semibold">
            OUSD Governance
          </div>
          <div className="mt-5 flex-1 flex flex-col">
            <nav className="flex-1 px-2 pb-4 space-y-1">
              <ActiveLink
                href="/"
                activeClassName={activeClass}
                inactiveClassName={inactiveClass}
              >
                <a>Dashboard</a>
              </ActiveLink>
              <ActiveLink
                href="/proposal"
                activeClassName={activeClass}
                inactiveClassName={inactiveClass}
              >
                <a>Proposals</a>
              </ActiveLink>
              <ActiveLink
                href="/leaderboard"
                activeClassName={activeClass}
                inactiveClassName={inactiveClass}
              >
                <a>Leaderboard</a>
              </ActiveLink>
            </nav>
          </div>
        </div>
      </div>

      <div className="md:pl-64 flex flex-col flex-1">
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
          <div className="flex items-right">Connect</div>
        </div>
        <div className="py-6">{children}</div>
      </div>
    </div>
  );
}
