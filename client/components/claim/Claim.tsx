import { FunctionComponent, useState } from "react";
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
import CardDescription from "components/CardDescription";
import BarChart from "components/BarChart";

interface ClaimProps {
  handlePrevStep: () => void;
}

const Claim: FunctionComponent<ClaimProps> = ({ handlePrevStep }) => {
  const { web3Provider, address } = useStore();

  const isEligible = true; // @TODO replace with real check
  const claimableOgv = "100"; // @TODO replace with real value

  const maxLockupDurationInWeeks = "208";

  const [lockupAmount, setLockupAmount] = useState(claimableOgv);
  const [lockupDuration, setLockupDuration] = useState(
    maxLockupDurationInWeeks
  );

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
    <>
      <div className="grid lg:grid-cols-11 gap-5 lg:gap-4">
        <div className="lg:col-span-6 lg:col-start-2">
          <CardGroup>
            <Card>
              <div className="divide-y space-y-6">
                <div className="space-y-4">
                  <SectionTitle>Claim OGV</SectionTitle>
                  <Card alt tightPadding>
                    <div className="space-y-1">
                      <CardLabel>You&apos;re claiming</CardLabel>
                      <div className="flex space-x-1 items-center">
                        <TokenIcon src="/ogv.svg" alt="OGV" />
                        <CardStat>100</CardStat>
                      </div>
                      <CardDescription>OGV</CardDescription>
                    </div>
                  </Card>
                  <div className="space-y-2">
                    <div>
                      <RangeInput
                        label="Lockup amount"
                        counterUnit="OGV"
                        min={"1"}
                        max={claimableOgv}
                        value={lockupAmount}
                        onChange={(e) => {
                          setLockupAmount(e.target.value);
                        }}
                        markers={[
                          {
                            label: "0%",
                            value: 0,
                          },
                          {
                            label: "",
                            value: 0,
                          },
                          {
                            label: "20%",
                            value: 20,
                          },
                          {
                            label: "",
                            value: 0,
                          },
                          {
                            label: "40%",
                            value: 40,
                          },
                          {
                            label: "",
                            value: 0,
                          },
                          {
                            label: "60%",
                            value: 60,
                          },
                          {
                            label: "",
                            value: 0,
                          },
                          {
                            label: "80%",
                            value: 80,
                          },
                          {
                            label: "",
                            value: 0,
                          },
                          {
                            label: "100%",
                            value: 100,
                          },
                        ]}
                        onMarkerClick={(markerValue) => {
                          if (markerValue) {
                            setLockupAmount((claimableOgv / 100) * markerValue);
                          }
                        }}
                      />
                    </div>
                    <div>
                      <RangeInput
                        label="Lockup length"
                        counterUnit="weeks"
                        min="0"
                        max={maxLockupDurationInWeeks}
                        value={lockupDuration}
                        onChange={(e) => {
                          setLockupDuration(e.target.value);
                        }}
                        markers={[
                          {
                            label: "0 wks",
                            value: 0,
                          },
                          {
                            label: "",
                            value: 0,
                          },
                          {
                            label: "1 yr",
                            value: 52,
                          },
                          {
                            label: "",
                            value: 0,
                          },
                          {
                            label: "2 yrs",
                            value: 104,
                          },
                          {
                            label: "",
                            value: 0,
                          },
                          {
                            label: "3 yrs",
                            value: 156,
                          },
                          {
                            label: "",
                            value: 0,
                          },
                          {
                            label: "4 yrs",
                            value: 208,
                          },
                        ]}
                        onMarkerClick={(markerValue) => {
                          if (markerValue) {
                            setLockupDuration(markerValue);
                          }
                        }}
                      />
                    </div>
                  </div>
                  <div className="pt-3">
                    <BarChart
                      data={{
                        labels: ["1 yr", "2 yr", "3 yr", "4 yr"],
                        datasets: [
                          {
                            label: "OGV",
                            data: new Array(4).fill(100),
                            backgroundColor: new Array(4).fill("#4bbc8a"),
                          },
                          {
                            label: "veOGV",
                            data: [25, 50, 75, 100],
                            backgroundColor: new Array(4).fill("#0d3020"),
                          },
                        ],
                      }}
                    />
                  </div>
                  <p>Estimated starting votes: 25</p>
                  <Button large>Claim and lock</Button>
                </div>
              </div>
            </Card>
            <Card>
              <div className="space-y-4">
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
            </Card>
          </CardGroup>
        </div>
        <div className="lg:col-span-3">
          <Card alt>
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
      <div className="grid lg:grid-cols-11 gap-5 lg:gap-4">
        <div className="lg:col-span-2 lg:col-start-2">
          <div className="mt-6 flex">
            <div className="mr-auto">
              <Button onClick={handlePrevStep}>
                &larr; Check Your Eligibility
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Claim;
