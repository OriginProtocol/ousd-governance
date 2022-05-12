import { FunctionComponent } from "react";
import { SectionTitle } from "components/SectionTitle";
import Card from "components/Card";

interface ClaimProps {}

const Claim: FunctionComponent<ClaimProps> = () => (
  <div className="grid lg:grid-cols-12 gap-5 lg:gap-4">
    <div className="lg:col-span-3 order-2 lg:order-1">
      <Card tightPadding alt>
        <SectionTitle>Current lockups</SectionTitle>
      </Card>
    </div>
    <div className="lg:col-span-6 order-1 lg:order-2">
      <Card tightPadding>
        <SectionTitle>Claim</SectionTitle>
      </Card>
    </div>
    <div className="lg:col-span-3 order-3">
      <Card tightPadding alt>
        <SectionTitle>Global stats</SectionTitle>
      </Card>
    </div>
  </div>
);

export default Claim;
