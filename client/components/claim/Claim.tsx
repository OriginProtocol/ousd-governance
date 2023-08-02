import { FunctionComponent } from "react";
import { SectionTitle } from "components/SectionTitle";
import Wrapper from "components/Wrapper";
import Card from "components/Card";
import CardGroup from "components/CardGroup";
import { Web3Button } from "components/Web3Button";
import OgvTotalStats from "components/OgvTotalStats";
import ClaimOgv from "components/claim/claim/ClaimOgv";
import ClaimVeOgv from "components/claim/claim/ClaimVeOgv";
import useClaim from "utils/useClaim";
import useHistoricalLockupToasts from "utils/useHistoricalLockupToasts";
import { useAccount } from "wagmi";

interface ClaimProps {
  handlePrevStep: () => void;
}

const Claim: FunctionComponent<ClaimProps> = () => {
  const { isConnected } = useAccount();
  const { hasClaim } = useClaim();

  useHistoricalLockupToasts();

  if (!isConnected) {
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
