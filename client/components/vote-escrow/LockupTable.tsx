import { FunctionComponent } from "react";
import moment from "moment";
import Card from "components/Card";
import TokenAmount from "components/TokenAmount";
import { Loading } from "components/Loading";
import TimeToDate from "components/utils/TimeToDate";

interface LockupTableProps {
  lockup: Object;
}

const LockupTable: FunctionComponent<LockupTableProps> = ({ lockup }) => {
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
          <th>Time remaining</th>
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
            <TimeToDate epoch={lockup.end} />
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
