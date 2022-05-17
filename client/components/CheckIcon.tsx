import { FunctionComponent } from "react";
import Image from "next/image";

const CheckIcon: FunctionComponent = () => (
  <Image src="/check.svg" height={22} width={22} alt="Eligible" />
);

export default CheckIcon;
