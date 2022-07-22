import { FunctionComponent } from "react";
import Image from "next/image";

interface TokenIconProps {
  src: string;
  alt?: string;
  large?: Boolean;
  small?: Boolean;
}

const TokenIcon: FunctionComponent<TokenIconProps> = ({
  src,
  alt,
  large,
  small,
}) => (
  <div className="flex items-center flex-shrink-0">
    <Image
      src={src}
      alt={alt}
      height={large ? 38 : small ? 24 : 28}
      width={large ? 38 : small ? 24 : 28}
    />
  </div>
);

export default TokenIcon;
