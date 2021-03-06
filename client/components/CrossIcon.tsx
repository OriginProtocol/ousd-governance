import { FunctionComponent } from "react";
import Image from "next/image";

const CrossIcon: FunctionComponent = () => (
  <Image src="/cross.svg" height={24} width={24} alt="Ineligible" />
);

export default CrossIcon;
