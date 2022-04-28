import { FunctionComponent, ChangeEventHandler } from "react";

interface RangeInputProps {
  label: string;
  counterUnit: string;
  min: string;
  max: string;
  value: number | string;
  markers?: string[];
  onChange: ChangeEventHandler<HTMLInputElement>;
}

const RangeInput: FunctionComponent<RangeInputProps> = ({
  label,
  counterUnit,
  min,
  max,
  value,
  markers,
  onChange,
}) => (
  <>
    <label className="label">
      <span className="label-text text-lg font-bold flex justify-between items-center w-full">
        <span>{label}</span>
        <span className="text-sm text-gray-500">
          {value} {counterUnit}
        </span>
      </span>
    </label>
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
          <div className="w-full flex justify-between text-xs text-gray-400">
            {markers.map((marker, index) => (
              <span key={index} className="flex flex-col items-center w-8">
                <span>|</span>
                <span className="mt-1">{marker}</span>
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  </>
);

export default RangeInput;
