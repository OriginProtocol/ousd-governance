import { FunctionComponent } from "react";
import moment from "moment";
import Card from "components/Card";
import Button from "components/Button";
import Link from "components/Link";
import { SectionTitle } from "components/SectionTitle";
import TokenAmount from "components/TokenAmount";
import { useStore } from "utils/store";
import { Loading } from "components/Loading";

interface YourLockupsProps {}

const YourLockups: FunctionComponent<YourLockupsProps> = () => {
  const { lockups } = useStore();

  if (!lockups) {
    return (
      <Card>
        <Loading />
      </Card>
    );
  }

  const handleExtend = () => {
    return;
  };

  const handleUnlock = () => {
    return;
  };

  return (
    <Card>
      <SectionTitle>
        {lockups.length > 0 ? "Your stakes" : "You have no active stakes"}
      </SectionTitle>
      {lockups.length > 0 && (
        <table className="table table-compact w-full">
          <thead>
            <tr>
              <th>OGV</th>
              <th>Duration</th>
              <th>Stake ends</th>
              <th>veOGV</th>
              <th>&nbsp;</th>
              <th>&nbsp;</th>
            </tr>
          </thead>
          <tbody>
            {lockups.map((lockup: Object) => (
              <tr key={`${lockup.lockupId}`}>
                <td>
                  <TokenAmount amount={lockup.amount} />
                </td>
                <td>
                  {moment.unix(lockup.end).diff(moment(), "months")} months
                </td>
                <td>{moment.unix(lockup.end).format("MMM D, YYYY")}</td>
                <td>
                  <TokenAmount amount={lockup.points} />
                </td>
                <td>
                  <Link
                    className="btn rounded-full btn-sm"
                    href={`/vote-escrow/${lockup.lockupId}`}
                  >
                    Extend
                  </Link>
                </td>
                <td>
                  <Button
                    alt
                    small
                    disabled={Date.now() / 1000 < lockup.end}
                    onClick={handleUnlock}
                  >
                    Unstake
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="mt-4">
        <Link className="btn btn-primary btn-lg" href="/vote-escrow/new">
          {lockups.length > 0 ? "Create a new stake" : "Stake your OGV now"}
        </Link>
      </div>
    </Card>
  );
};

export default YourLockups;
