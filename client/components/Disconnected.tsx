import Card from "components/Card";

export function Disconnected({}) {
  return (
    <Card dark>
      <div className="text-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="mx-auto h-12 w-12 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-white">No wallet</h3>
        <p className="mt-1 text-sm text-gray-500">
          Click the connect button in the top right to connect a wallet
        </p>
      </div>
    </Card>
  );
}
