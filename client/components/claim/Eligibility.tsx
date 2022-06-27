import { FunctionComponent, useCallback } from "react";
import { utils, BigNumber } from "ethers";
import Image from "next/image";
import { SectionTitle } from "components/SectionTitle";
import Card from "components/Card";
import { Web3Button } from "components/Web3Button";
import Button from "components/Button";
import { useStore } from "utils/store";
import { truncateEthAddress } from "utils/index";
import TokenIcon from "components/TokenIcon";
import CheckIcon from "components/CheckIcon";
import CrossIcon from "components/CrossIcon";
import useClaim from "utils/useClaim";
import { formatCurrency } from "utils/math";
import ReactTooltip from 'react-tooltip';

const EligibilityItem = ({
  id,
  showCheckMark,
  itemTitle,
  tokens,
  showOgvToken  
}) => {
  return (
    <>
      <tr>
        <td>
          <div className="flex space-x-2 items-center">
            {showCheckMark ? <CheckIcon /> : <CrossIcon />}
            <span>{itemTitle}</span>
          </div>
        </td>
        <td>
          <div className="flex space-x-2 items-center">
            <TokenIcon
              src={showOgvToken ? '/ogv.svg' : '/veogv.svg'}
              alt={showOgvToken ? 'OGV' : 'veOGV'}
            />
            <ReactTooltip id={id} place="top" type="dark" effect="solid">
              <span>
                <span className="mr-1">{utils.formatUnits(tokens, 18)}</span>
                {showOgvToken ? 'OGV' : 'veOGV'}
              </span>
            </ReactTooltip>
            <div data-tip data-for={id}>
              <span>
                <span className="mr-1">{formatCurrency(utils.formatUnits(tokens, 18))}</span>
                {showOgvToken ? 'OGV' : 'veOGV'}
              </span>
            </div>
          </div>
        </td>
      </tr>
    </>
  );
};

interface EligibilityProps {
  handleNextStep: () => void;
}

const Eligibility: FunctionComponent<EligibilityProps> = ({
  handleNextStep,
}) => {
  const { provider, web3Provider, address, web3Modal } = useStore();
  const claim = useClaim();

  const isEligible = claim.loaded && claim.claimData.hasClaim;
  const claimValid = isEligible && claim.optional && claim.mandatory && 
    claim.optional.isValid && claim.mandatory.isValid

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

  console.log("CLAIM", claim)
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
                  {claimValid ? (
                    <div className="bg-accent text-white font-bold px-2 py-4 text-center text-lg">
                      <p className="">
                        {truncateEthAddress(address)} is eligible to claim!
                      </p>
                    </div>
                  ) : (
                    <div className="bg-orange-500 text-white font-bold px-2 py-4 text-center text-lg">
                      <p className="">
                        {truncateEthAddress(address)} has an invalid claim proof!
                      </p>
                    </div>
                  )}
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
          {isEligible && <table className="table w-full mt-6">
            <thead>
              <tr>
                <th>Eligibility Criteria</th>
                <th>Tokens</th>
              </tr>
            </thead>
            <tbody>
              <EligibilityItem
                id="ogn-holder"
                showCheckMark={BigNumber.from(0).gt(0)} // @TODO change this
                itemTitle="OGN holder"
                tokens={BigNumber.from(0)} // @TODO change this
                showOgvToken={true}
              />
              <EligibilityItem
                id="ousd-lp"
                showCheckMark={BigNumber.from(0).gt(0)} // @TODO change this
                itemTitle="OUSD liquidity provider"
                tokens={BigNumber.from(0)} // @TODO change this
                showOgvToken={true}
              />
              <EligibilityItem
                id="ousd-holder"
                showCheckMark={claim.claimData.split.ousd.gt(0)}
                itemTitle="OUSD holder"
                tokens={claim.claimData.split.ousd}
                showOgvToken={false}
              />
              <EligibilityItem
                id="wousd-holder"
                showCheckMark={claim.claimData.split.wousd.gt(0)}
                itemTitle="WOUSD holder"
                tokens={claim.claimData.split.wousd}
                showOgvToken={false}
              />
            </tbody>
          </table>}
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
