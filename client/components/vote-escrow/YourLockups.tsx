import { FunctionComponent } from "react";
import moment from "moment";
import useSWR from "swr";
import { fetcher } from "utils/index";
import Card from "components/Card";
import Button from "components/Button";
import { SectionTitle } from "components/SectionTitle";
import TokenAmount from "components/TokenAmount";
import { useStore } from "utils/store";

interface YourLockupsProps {}

const YourLockups: FunctionComponent<YourLockupsProps> = () => {
  const { address } = useStore();
  const { data } = useSWR(`/api/lockups?account=${address}`, fetcher);

  return (
    <Card>
      <SectionTitle>
        {data?.lockups.length > 0
          ? "Your lockups"
          : "You have no active lockups"}
      </SectionTitle>
      {!data && <p>Loading...</p>}
      {data?.lockups.length > 0 && (
        <table className="table w-full">
          <thead>
            <tr>
              <th>OGV</th>
              <th>Duration</th>
              <th>Lockup ends</th>
              <th>veOGV</th>
              <th>&nbsp;</th>
              <th>&nbsp;</th>
            </tr>
          </thead>
          <tbody>
            {data?.lockups.map((lockup: Object) => (
              <tr key={lockup.lockupId}>
                <td>
                  <TokenAmount amount={lockup.amount} />
                </td>
                <td>{lockup.weeks} weeks</td>
                <td>{moment(parseInt(lockup.end)).format("MMM D, YYYY")}</td>
                <td>
                  <TokenAmount amount={lockup.points} />
                </td>
                <td>
                  <Button small>Extend</Button>
                </td>
                <td>
                  <Button small>Unlock</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <a className="btn btn-primary btn-lg" href="/vote-escrow/new">
        Lock up your OGV
      </a>
    </Card>
  );
};

export default YourLockups;
