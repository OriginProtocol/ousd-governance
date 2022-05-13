import { FunctionComponent, useCallback } from "react";
import { SectionTitle } from "components/SectionTitle";
import Card from "components/Card";
import { Web3Button } from "components/Web3Button";
import Button from "components/Button";
import { useStore } from "utils/store";
import { truncateEthAddress } from "utils/index";
import TokenIcon from "components/TokenIcon";

interface EligibilityProps {}

const Eligibility: FunctionComponent<EligibilityProps> = () => {
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
    [provider, resetWeb3State]
  );

  return (
    <Card>
      <div className="space-y-4">
        {!web3Provider ? (
          <>
            <SectionTitle>Check claim eligability</SectionTitle>
            <p className="text-sm text-gray-600">
              Connect your wallet below to learn if you&apos;re eligible to
              claim.
            </p>
            <Web3Button inPage />
          </>
        ) : (
          <>
            {isEligible ? (
              <>
                <SectionTitle>
                  Congrats! You&apos;re eligible to claim 🎉
                </SectionTitle>
                <Card tightPadding alt>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-sm text-gray-600">
                        {truncateEthAddress(address)} can claim...
                      </span>
                      <div className="flex space-x-2 font-bold text-2xl text-gray-800">
                        <div className="flex items-center space-x-1">
                          <span>100 OGV</span>
                        </div>
                        <span>+</span>
                        <div className="flex items-center space-x-1">
                          <span>50 veOGV</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <Button>Claim</Button>
                    </div>
                  </div>
                </Card>
              </>
            ) : (
              <>
                <SectionTitle>
                  Unfortunately, you&apos;re not eligible to claim.
                </SectionTitle>
                <p className="text-sm text-gray-600">
                  Try connecting another wallet.
                </p>
              </>
            )}
            <button
              className="text-sm text-gray-500 underline ml-auto"
              onClick={handleDisconnect}
            >
              Disconnect to check another address
            </button>
          </>
        )}
        <table className="table w-full">
          <thead>
            <tr>
              <th>Eligibility criteria</th>
              <th>Claimable tokens</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                OGN holder {web3Provider ? (isEligible ? `✅` : `❌`) : ``}
              </td>
              <td>
                <div className="flex space-x-1 items-center">
                  {web3Provider ? (
                    isEligible ? (
                      <span>50x</span>
                    ) : (
                      <span>0</span>
                    )
                  ) : (
                    ``
                  )}
                  <TokenIcon />
                  <span>OGV</span>
                </div>
              </td>
            </tr>
            <tr>
              <td>
                OUSD liquidity provider{" "}
                {web3Provider ? (isEligible ? `✅` : `❌`) : ``}
              </td>
              <td>
                <div className="flex space-x-1 items-center">
                  {web3Provider ? (
                    isEligible ? (
                      <span>50x</span>
                    ) : (
                      <span>0</span>
                    )
                  ) : (
                    ``
                  )}
                  <TokenIcon />
                  <span>OGV</span>
                </div>
              </td>
            </tr>
            <tr>
              <td>
                OUSD holder {web3Provider ? (isEligible ? `✅` : `❌`) : ``}
              </td>
              <td>
                <div className="flex space-x-1 items-center">
                  {web3Provider ? (
                    isEligible ? (
                      <span>50x</span>
                    ) : (
                      <span>0</span>
                    )
                  ) : (
                    ``
                  )}
                  <TokenIcon />
                  <span>veOGV</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default Eligibility;
