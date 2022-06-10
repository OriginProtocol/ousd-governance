import { FunctionComponent, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { sample, random } from "lodash";
import { truncateEthAddress } from "utils";
import { SectionTitle } from "components/SectionTitle";
import Wrapper from "components/Wrapper";
import Card from "components/Card";
import CardGroup from "components/CardGroup";
import Button from "components/Button";
import { useStore } from "utils/store";
import { Web3Button } from "components/Web3Button";
import OgvTotalStats from "components/OgvTotalStats";
import ClaimOgv from "components/claim/claim/ClaimOgv";
import ClaimVeOgv from "components/claim/claim/ClaimVeOgv";

interface ClaimProps {
  handlePrevStep: () => void;
}

const Claim: FunctionComponent<ClaimProps> = ({ handlePrevStep }) => {
  const { web3Provider } = useStore();
  const isEligible = true; // @TODO replace with real check

  useEffect(() => {
    // @TODO Replace with real lockup data
    const recentLockups = [
      {
        address: "0x57b0dd7967955c92b6e34a038b47fee63e1efd1a",
        ogvLockedUp: 10000,
        durationInWeeks: 208,
      },
      {
        address: "0x2C6B8C19dd7174F6e0cc56424210F19EeFe62f94",
        ogvLockedUp: 5000,
        durationInWeeks: 156,
      },
      {
        address: "0xe6030d4e773888e1dfe4cc31da6e05bfe53091ac",
        ogvLockedUp: 1234,
        durationInWeeks: 52,
      },
    ];

    const alertLoop = setInterval(async () => {
      const lockup = sample(recentLockups);
      const { address, ogvLockedUp, durationInWeeks } = lockup;
      const shortAddress =
        web3Provider?.chainId === 1
          ? (await web3Provider.lookupAddress(address)) ||
            truncateEthAddress(address)
          : truncateEthAddress(address);

      toast.success(
        `${shortAddress} just locked up ${ogvLockedUp} OGV for ${durationInWeeks} weeks`,
        {
          hideProgressBar: true,
          position: "bottom-right",
        }
      );
    }, random(5000, 20000, true));

    return () => clearInterval(alertLoop);
  }, [web3Provider]);

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
      <CardGroup>
        <OgvTotalStats />
        <ClaimOgv />
        <ClaimVeOgv />
      </CardGroup>
      <div className="mt-6 flex">
        <div className="mr-auto">
          <Button onClick={handlePrevStep}>&larr; Learn about Origin</Button>
        </div>
      </div>
    </>
  );
};

export default Claim;
