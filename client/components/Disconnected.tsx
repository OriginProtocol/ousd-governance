export function Disconnected({}) {
  return (
    <div className="text-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="mx-auto h-12 w-12 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
        />
      </svg>
      <h3 className="mt-2 text-sm font-medium text-gray-900">No wallet</h3>
      <p className="mt-1 text-sm text-gray-500">
        Click the connect button in the top right to connect a wallet
      </p>
    </div>
  );
}