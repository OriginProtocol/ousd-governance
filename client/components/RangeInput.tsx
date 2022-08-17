import { FunctionComponent, ChangeEventHandler } from "react";
import TokenAmount from "components/TokenAmount";

interface RangeInputProps {
  label: string;
  counterUnit: string;
  min: string;
  max: string;
  value: number | string;
  markers?: object[];
  onChange: ChangeEventHandler<HTMLInputElement>;
  onMarkerClick?: (marker: string) => void;
  hideLabel?: Boolean;
  hideLabelFormatting?: Boolean;
}

const RangeInput: FunctionComponent<RangeInputProps> = ({
  label,
  counterUnit,
  min,
  max,
  value,
  markers,
  onChange,
  onMarkerClick,
  hideLabel,
  hideLabelFormatting,
}) => (
  <>
    {!hideLabel && (
      <label className="label">
        <span className="label-text text-lg flex justify-between items-center w-full">
          <span>
            {label}&nbsp;
            {hideLabelFormatting ? value : <TokenAmount amount={value} />}
            &nbsp;{counterUnit}
          </span>
        </span>
      </label>
    )}
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
                {marker.value ? (
                  <button
                    onClick={
                      onMarkerClick ? () => onMarkerClick(marker.value) : null
                    }
                    className="mt-1 hover:underline"
                  >
                    {marker.label}
                  </button>
                ) : (
                  <span className="mt-1">{marker.label}</span>
                )}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  </>
);

export default RangeInput;
