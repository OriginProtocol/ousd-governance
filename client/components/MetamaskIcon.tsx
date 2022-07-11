import { FunctionComponent } from "react";
import Image from "next/image";

interface MetamaskIconProps {
  large?: Boolean;
}

const MetamaskIcon: FunctionComponent<MetamaskIconProps> = ({ large }) => (
  <div className="items-center flex-shrink-0">
    <Image
      src="/metamask-icon.svg"
      alt="Metamask icon"
      height={large ? 41 : 28}
      width={large ? 43 : 30}
    />
  </div>
);

export default MetamaskIcon;
