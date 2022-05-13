import { FunctionComponent } from "react";
import { SectionTitle } from "components/SectionTitle";
import Card from "components/Card";

interface ExplanationProps {}

const Explanation: FunctionComponent<ExplanationProps> = () => (
  <Card>
    <SectionTitle>Explanation</SectionTitle>
    <p className="text-sm text-gray-600">
      Here&apos;s what OGV is, why you can claim it and what you can do with it...
    </p>
  </Card>
);

export default Explanation;
