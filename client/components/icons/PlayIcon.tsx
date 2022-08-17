import { FunctionComponent } from "react";
import Image from "next/image";

const PlayIcon: FunctionComponent = () => (
  <Image src="/play.svg" height={48} width={48} alt="Play" />
);

export default PlayIcon;
