import { FunctionComponent } from "react";
import Image from "next/image";

interface SlideNavProps {
  currentSlide: number;
  slides: Array<string>;
  handlePrevSlide?: () => void;
  handleNextSlide?: () => void;
}

const SlideNav: FunctionComponent<SlideNavProps> = ({
  currentSlide,
  slides,
  handlePrevSlide,
  handleNextSlide,
}) => (
  <div className="flex items-center justify-between">
    {slides[currentSlide - 1] !== undefined && (
      <div className="mr-auto">
        <button
          className="flex items-center text-gray-800 text-sm hover:opacity-80"
          onClick={handlePrevSlide}
        >
          <Image
            src="/chevron-left.svg"
            height={24}
            width={24}
            alt="Previous"
          />{" "}
          {slides[currentSlide - 1]}
        </button>
      </div>
    )}
    {slides[currentSlide + 1] !== undefined && (
      <div className="ml-auto">
        <button
          className="flex items-center text-gray-800 text-sm hover:opacity-80"
          onClick={handleNextSlide}
        >
          {slides[currentSlide + 1]}{" "}
          <Image src="/chevron-right.svg" height={24} width={24} alt="Next" />
        </button>
      </div>
    )}
  </div>
);

export default SlideNav;
