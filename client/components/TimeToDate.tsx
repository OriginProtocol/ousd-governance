import { FunctionComponent, ReactNode } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useStore } from "utils/store";
import { SECONDS_IN_A_MONTH } from "../constants/index";

dayjs.extend(relativeTime);

interface TimeToDateProps {
  epoch: number;
}

const TimeToDate: FunctionComponent<TimeToDateProps> = ({ epoch }) => {
  const { blockTimestamp } = useStore();

  const monthsRemaining = Math.floor(
    (epoch - blockTimestamp) / SECONDS_IN_A_MONTH
  );

  return (
    <span>
      {monthsRemaining > 1 ? (
        <>{monthsRemaining} months</>
      ) : (
        <>
          {monthsRemaining === 1 ? (
            <>{monthsRemaining} month</>
          ) : (
            <>{dayjs.unix(epoch).fromNow(true)}</>
          )}
        </>
      )}
    </span>
  );
};

export default TimeToDate;
