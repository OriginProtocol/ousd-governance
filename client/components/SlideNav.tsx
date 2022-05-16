import { FunctionComponent } from "react";
import Image from "next/image";

interface SlideNavProps {
  currentSlide: number;
  slides: Array<string>;
  onDotClick?: (dot: number) => void;
}

const SlideNav: FunctionComponent<SlideNavProps> = ({
  currentSlide,
  slides,
  onDotClick,
}) => (
  <ul className="flex items-center justify-between absolute top-1/2">
    <li>
      <button className="bg-primary rounded-full flex items-center justify-center">
        <Image src="/chevron-left.svg" height={34} width={34} alt="Previous" />
      </button>
    </li>
    <li>
      <button>
        <Image src="/chevron-right.svg" height={34} width={34} alt="Next" />
      </button>
    </li>
  </ul>
);

export default SlideNav;
