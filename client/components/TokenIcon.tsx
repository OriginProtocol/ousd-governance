import { FunctionComponent } from "react";
import Image from "next/image";

interface TokenIconProps {
  src: string;
  alt?: string;
}

const TokenIcon: FunctionComponent<TokenIconProps> = ({ src, alt }) => (
  <div className="flex items-center">
    <Image src={src} alt={alt} height={28} width={28} />
  </div>
);

export default TokenIcon;
