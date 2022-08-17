import { FunctionComponent } from "react";
import Image from "next/image";

interface ExternalLinkIconProps {
  isGreen?: boolean;
}

const ExternalLinkIcon: FunctionComponent<ExternalLinkIconProps> = ({
  isGreen,
}) => (
  <Image
    src={`/external-link${isGreen ? "-green" : ""}.svg`}
    height={14}
    width={14}
    alt="External link"
  />
);

export default ExternalLinkIcon;
