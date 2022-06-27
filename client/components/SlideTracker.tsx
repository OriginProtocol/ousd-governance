import { FunctionComponent } from "react";

interface SlideTrackerProps {
  currentSlide: number;
  slides: Array<string>;
  onDotClick?: (dot: number) => void;
}

const SlideTracker: FunctionComponent<SlideTrackerProps> = ({
  currentSlide,
  slides,
  onDotClick,
}) => (
  <ul className="flex items-center justify-center space-x-1">
    {slides.map((slide, index) => (
      <li key={index}>
        <button
          className={
            currentSlide == index
              ? "h-2 w-2 rounded-full bg-gray-500"
              : "h-2 w-2 rounded-full bg-gray-500 opacity-50"
          }
          onClick={onDotClick ? () => onDotClick(index) : () => null}
        />
      </li>
    ))}
  </ul>
);

export default SlideTracker;
