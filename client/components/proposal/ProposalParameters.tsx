import { ethers } from "ethers";
import { useEffect, useState } from "react";
import { useStore } from "utils/store";
import { truncateBalance } from "utils/index";

export const ProposalParameters = ({ proposal, state, quorum }) => {
  const { rpcProvider } = useStore();
  const [blockNumber, setBlockNumber] = useState(0);

  useEffect(() => {
    const getBlockNumber = async () => {
      const blockNumber = await rpcProvider.getBlockNumber();
      setBlockNumber(parseInt(blockNumber));
    };
    if (rpcProvider) {
      getBlockNumber();
    }
  }, [rpcProvider]);

  const blockDifference = proposal.endBlock - proposal.startBlock;
  const blocksSinceStart = blockNumber - proposal.startBlock;

  return (
    <div className="bg-white shadow overflow-x-auto sm:rounded-lg mt-5">
      <div className="border-t border-gray-100 px-4 py-5 sm:p-0">
        <dl className="sm:divide-y sm:divide-gray-200">
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-400">Current block</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {blockNumber.toString()}
            </dd>
          </div>
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-400">Start block</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {proposal.startBlock.toString()}
            </dd>
          </div>
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-400">End block</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {proposal.endBlock.toString()}
            </dd>
          </div>
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-400">Progress</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              <progress
                className="progress progress-accent w-56"
                value={blocksSinceStart}
                max={blockDifference}
              ></progress>
            </dd>
          </div>
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-400">Quorum</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {truncateBalance(ethers.utils.formatUnits(quorum))}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
};
