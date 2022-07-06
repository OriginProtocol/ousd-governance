import { FunctionComponent } from "react";
import Image from "next/image";

interface TokenIconProps {
  src: string;
  alt?: string;
  large?: Boolean;
}

const TokenIcon: FunctionComponent<TokenIconProps> = ({ src, alt, large }) => (
  <div className="flex items-center flex-shrink-0">
    <Image
      src={src}
      alt={alt}
      height={large ? 38 : 28}
      width={large ? 38 : 28}
    />
  </div>
);

export default TokenIcon;
