import { FunctionComponent } from "react";
import { SectionTitle } from "components/SectionTitle";
import Wrapper from "components/Wrapper";
import Card from "components/Card";
import CardGroup from "components/CardGroup";
import CardLabel from "components/CardLabel";
import CardStat from "components/CardStat";
import RangeInput from "components/vote-escrow/RangeInput";
import Button from "components/Button";
import { truncateEthAddress } from "utils/index";
import { useStore } from "utils/store";
import { Web3Button } from "components/Web3Button";
import TokenIcon from "components/TokenIcon";

interface ClaimProps {}

const Claim: FunctionComponent<ClaimProps> = () => {
  const { web3Provider, address } = useStore();
  const isEligible = true; // @TODO replace with real check

  if (!web3Provider) {
    return (
      <Wrapper narrow>
        <Card>
          <SectionTitle>Please connect your wallet to claim</SectionTitle>
          <Web3Button inPage />
        </Card>
      </Wrapper>
    );
  }

  if (!isEligible) {
    return (
      <Wrapper narrow>
        <Card>
          <SectionTitle>
            Unfortunately, you&apos;re not eligible to claim.
          </SectionTitle>
          <p className="text-sm text-gray-600">
            Try connecting another wallet.
          </p>
        </Card>
      </Wrapper>
    );
  }

  return (
    <div className="grid lg:grid-cols-11 gap-5 lg:gap-4">
      <div className="lg:col-span-6 lg:col-start-2">
        <Card>
          <div className="divide-y space-y-6">
            <div className="space-y-4">
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
                    </div>
                  </div>
                </div>
              </Card>
              <p className="text-sm text-gray-600">
                If you lockup your OGV, you&apos;ll be rewarded with...
              </p>
              <div>
                <RangeInput
                  label="Lockup length"
                  counterUnit="weeks"
                  min="0"
                  max="208"
                  value="208"
                />
                <ul className="w-full flex space-x-3 text-sm text-gray-500 justify-end">
                  <li>
                    <button className="underline">1 year</button>
                  </li>
                  <li>
                    <button className="underline">2 years</button>
                  </li>
                  <li>
                    <button className="underline">3 years</button>
                  </li>
                  <li>
                    <button className="underline">4 years</button>
                  </li>
                </ul>
              </div>
              <Button large>Claim and lock</Button>
            </div>
            <div className="space-y-4 pt-6">
              <Card tightPadding alt>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-sm text-gray-600">
                      {truncateEthAddress(address)} can claim...
                    </span>
                    <div className="flex space-x-2 font-bold text-2xl text-gray-800">
                      <div className="flex items-center space-x-1">
                        <span>50 veOGV</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
              <p className="text-sm text-gray-600">
                Your veOGV gives X voting power for...
              </p>
              <Button large>Claim</Button>
            </div>
          </div>
        </Card>
      </div>
      <div className="lg:col-span-3">
        <Card tightPadding alt>
          <div className="divide-y space-y-6">
            <div>
              <SectionTitle>Total OGV lockup stats</SectionTitle>
              <CardGroup>
                <div>
                  <Card tightPadding>
                    <div className="space-y-1">
                      <CardLabel>OGV locked up</CardLabel>
                      <CardStat>1,000,000</CardStat>
                    </div>
                  </Card>
                </div>
                <div>
                  <Card tightPadding>
                    <div className="space-y-1">
                      <CardLabel>% of OGV locked up</CardLabel>
                      <CardStat>50%</CardStat>
                    </div>
                  </Card>
                </div>
                <div>
                  <Card tightPadding>
                    <div className="space-y-1">
                      <CardLabel>Average lock time</CardLabel>
                      <CardStat>104 weeks</CardStat>
                    </div>
                  </Card>
                </div>
              </CardGroup>
            </div>
            <div className="pt-6">
              <SectionTitle>Latest events</SectionTitle>
              <table className="text-sm  w-full">
                <tbody className="divide-y space-y-3">
                  <tr className="flex flex-col">
                    <td className="flex justify-between items-center">
                      <button className="underline font-bold">
                        Claim and lock
                      </button>
                      <span className="text-xs text-gray-600">
                        13/05/2022 09:00
                      </span>
                    </td>
                    <td className="flex justify-between items-center">
                      <button>{truncateEthAddress(address)}</button>
                      <div className="flex justify-between items-center space-x-1">
                        <TokenIcon src="/ogv.svg" alt="OGV" />
                        <span>100 OGV</span>
                      </div>
                    </td>
                  </tr>
                  <tr className="flex flex-col pt-3">
                    <td className="flex justify-between items-center">
                      <button className="underline font-bold">Claim</button>
                      <span className="text-xs text-gray-600">
                        13/05/2022 08:00
                      </span>
                    </td>
                    <td className="flex justify-between items-center">
                      <button>{truncateEthAddress(address)}</button>
                      <div className="flex justify-between items-center space-x-1">
                        <TokenIcon src="/ogv.svg" alt="OGV" />
                        <span>50 OGV</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Claim;
