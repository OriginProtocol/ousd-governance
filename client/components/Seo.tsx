import { FunctionComponent } from "react";
import { NextSeo } from "next-seo";

interface SeoProps {
  title?: string;
}

const Seo: FunctionComponent<SeoProps> = ({ title }) => (
  <NextSeo title={title ? `${title} | OUSD Governance` : "OUSD Governance"} />
);

export default Seo;
