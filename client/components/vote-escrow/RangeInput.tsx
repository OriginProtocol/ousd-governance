import { FunctionComponent, ChangeEventHandler } from "react";

interface RangeInputProps {
  min: string;
  max: string;
  value: number | string;
  markers?: string[];
  onChange: ChangeEventHandler<HTMLInputElement>;
}

const RangeInput: FunctionComponent<RangeInputProps> = ({
  min,
  max,
  value,
  markers,
  onChange,
}) => (
  <div>
    <input
      className="range range-lg range-accent"
      type="range"
      min={min || "0"}
      max={max}
      value={value}
      onChange={onChange}
    />
    {markers && markers.length > 0 && (
      <>
        <div className="w-full flex justify-between text-xs text-gray-400 px-3">
          {markers.map((marker, index) => (
            <span key={index}>|</span>
          ))}
        </div>
        <div className="w-full flex justify-between text-xs text-gray-400 pt-1">
          {markers.map((marker, index) => (
            <span key={index}>{marker}</span>
          ))}
        </div>
      </>
    )}
  </div>
);

export default RangeInput;
