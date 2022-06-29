import { FunctionComponent } from "react";
import moment from "moment";
import Card from "components/Card";
import Button from "components/Button";
import { SectionTitle } from "components/SectionTitle";
import TokenAmount from "components/TokenAmount";
import { useStore } from "utils/store";
import { Loading } from "components/Loading";
import { ethers } from "ethers";

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

  return (
    <Card>
      <SectionTitle>
        {lockups.length > 0 ? "Your lockups" : "You have no active lockups"}
      </SectionTitle>
      {lockups.length > 0 && (
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
            {lockups.map((lockup: Object) => (
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
        {lockups.length > 0 ? "Create another lockup" : "Lock up your OGV now"}
      </a>
    </Card>
  );
};

export default YourLockups;
