import { FunctionComponent } from "react";
import { SectionTitle } from "components/SectionTitle";
import Card from "components/Card";

interface ExplanationProps {}

const Explanation: FunctionComponent<ExplanationProps> = () => (
  <Card>
    <SectionTitle>Explanation</SectionTitle>
  </Card>
);

export default Explanation;
