import { FunctionComponent } from "react";
import moment from "moment";
import Card from "components/Card";
import TokenAmount from "components/TokenAmount";
import { Loading } from "components/Loading";
import { useStore } from "utils/store";
import { SECONDS_IN_A_MONTH } from "constants/index";

interface LockupTableProps {
  lockup: Object;
}

const LockupTable: FunctionComponent<LockupTableProps> = ({ lockup }) => {
  const { blockTimestamp } = useStore();

  if (!lockup) {
    return (
      <Card>
        <Loading />
      </Card>
    );
  }

  return (
    <table className="table table-compact w-full">
      <thead>
        <tr>
          <th>OGV</th>
          <th>Duration</th>
          <th>Lockup ends</th>
          <th>veOGV</th>
        </tr>
      </thead>
      <tbody>
        <tr key={`${lockup.lockupId}`}>
          <td>
            <TokenAmount amount={lockup.amount} />
          </td>
          <td>
            {Math.floor((lockup.end - blockTimestamp) / SECONDS_IN_A_MONTH)}{" "}
            months
          </td>
          <td>{moment.unix(lockup.end).format("MMM D, YYYY")}</td>
          <td>
            <TokenAmount amount={lockup.points} />
          </td>
        </tr>
      </tbody>
    </table>
  );
};

export default LockupTable;
