import TokenAmount from "components/TokenAmount";
import { useFutureBlockTime } from "utils/useFutureBlockTime";
import { toDaysMinutesSeconds } from "utils/index";

export const ProposalParameters = ({ proposal, state, quorum }) => {
  const endBlockTimestamp = useFutureBlockTime(proposal.endBlock);

  return (
    <div className="bg-white shadow overflow-x-auto sm:rounded-lg mt-5">
      <div className="border-t border-gray-100 px-4 py-5 sm:p-0">
        <dl className="sm:divide-y sm:divide-gray-200">
          {state === 1 && endBlockTimestamp !== 0 && (
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-400">Time Left</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {toDaysMinutesSeconds(endBlockTimestamp)}
              </dd>
            </div>
          )}
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-400">Quorum</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              <TokenAmount amount={quorum} />
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
};
