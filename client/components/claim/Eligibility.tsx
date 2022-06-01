import { FunctionComponent, useCallback } from "react";
import Image from "next/image";
import { SectionTitle } from "components/SectionTitle";
import Card from "components/Card";
import { Web3Button } from "components/Web3Button";
import Button from "components/Button";
import { useStore } from "utils/store";
import { truncateEthAddress } from "utils/index";
import TokenIcon from "components/TokenIcon";
import CheckIcon from "components/CheckIcon";

interface EligibilityProps {
  handleNextStep: () => void;
}

const Eligibility: FunctionComponent<EligibilityProps> = ({
  handleNextStep,
}) => {
  const { provider, web3Provider, address, web3Modal } = useStore();

  const isEligible = true; // @TODO replace with real check

  const resetWeb3State = useStore((state) => state.reset);

  const handleDisconnect = useCallback(
    async function () {
      await web3Modal.clearCachedProvider();
      if (provider?.disconnect && typeof provider.disconnect === "function") {
        await provider.disconnect();
      }
      resetWeb3State();
    },
    [web3Modal, provider, resetWeb3State]
  );

  const canAdvance = web3Provider && isEligible;

  return (
    <>
      <Card>
        <div>
          <SectionTitle>Check Your Eligibility</SectionTitle>
          {!web3Provider ? (
            <>
              <p className="text-sm text-gray-600">
                Connect your wallet below to learn if you&apos;re eligible to
                claim.
              </p>
              <div className="pt-6">
                <Web3Button inPage />
              </div>
            </>
          ) : (
            <>
              {isEligible ? (
                <>
                  <div className="bg-accent text-white font-bold px-2 py-4 text-center text-lg">
                    <p className="">
                      {truncateEthAddress(address)} is eligible to claim!
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-gray-500 text-white font-bold px-2 py-4 text-center text-lg">
                    <p className="">
                      Unfortunately, {truncateEthAddress(address)} isn&apos;t
                      eligible to claim
                    </p>
                  </div>
                </>
              )}
              <div className="mt-2">
                <button
                  className="text-sm text-gray-500 underline ml-auto block"
                  onClick={handleDisconnect}
                >
                  Try another address
                </button>
              </div>
            </>
          )}
          <table className="table w-full mt-6">
            <thead>
              <tr>
                <th>Eligibility Criteria</th>
                <th>Tokens</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <div className="flex space-x-2 items-center">
                    {canAdvance && <CheckIcon />}
                    <span>OGN holder</span>
                  </div>
                </td>
                <td>
                  <div className="flex space-x-2 items-center">
                    <TokenIcon src="/ogv.svg" alt="OGV" />
                    <span>OGV</span>
                  </div>
                </td>
              </tr>
              <tr>
                <td>
                  <div className="flex space-x-2 items-center">
                    {canAdvance && <CheckIcon />}
                    <span>OUSD liquidity provider</span>
                  </div>
                </td>
                <td>
                  <div className="flex space-x-2 items-center">
                    <TokenIcon src="/ogv.svg" alt="OGV" />
                    <span>OGV</span>
                  </div>
                </td>
              </tr>
              <tr>
                <td>
                  <div className="flex space-x-2 items-center">
                    {canAdvance && <CheckIcon />}
                    <span>OUSD holder</span>
                  </div>
                </td>
                <td>
                  <div className="flex space-x-2 items-center">
                    <TokenIcon src="/veogv.svg" alt="veOGV" />
                    <span>veOGV</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
      <div className="mt-6 flex">
        <div className="ml-auto">
          <Button onClick={handleNextStep}>Learn about Origin &rarr;</Button>
        </div>
      </div>
    </>
  );
};

export default Eligibility;
