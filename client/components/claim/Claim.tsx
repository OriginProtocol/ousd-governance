import { FunctionComponent, useEffect, useState } from "react";
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
import useClaim from "utils/useClaim";
import useHistoricalLockupToasts from "utils/useHistoricalLockupToasts";

interface ClaimProps {
  handlePrevStep: () => void;
}

const Claim: FunctionComponent<ClaimProps> = ({ handlePrevStep }) => {
  const { web3Provider, contracts } = useStore();
  const { hasClaim } = useClaim();

  useHistoricalLockupToasts();

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

  if (!hasClaim) {
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
    <CardGroup>
      <OgvTotalStats />
      <ClaimOgv />
      <ClaimVeOgv />
    </CardGroup>
  );
};

export default Claim;
