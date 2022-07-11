import { FunctionComponent } from "react";
import moment from "moment";
import Card from "components/Card";
import Button from "components/Button";
import Link from "components/Link";
import { SectionTitle } from "components/SectionTitle";
import TokenAmount from "components/TokenAmount";
import { useStore } from "utils/store";
import { Loading } from "components/Loading";
import { toast } from "react-toastify";
import useAccountBalances from "utils/useAccountBalances";
import useTotalBalances from "utils/useTotalBalances";
import useLockups from "utils/useLockups";

interface YourLockupsProps {}

const YourLockups: FunctionComponent<YourLockupsProps> = () => {
  const { lockups, pendingTransactions, contracts, balances } = useStore();
  const { ogv } = balances;
  const { reloadTotalBalances } = useTotalBalances();
  const { reloadAccountBalances } = useAccountBalances();
  const { reloadLockups } = useLockups();

  if (!lockups) {
    return (
      <Card>
        <Loading />
      </Card>
    );
  }

  const handleUnlock = async (lockupId) => {
    const transaction = await contracts.OgvStaking["unstake(uint256)"](
      lockupId,
      { gasLimit: 1000000 }
    ); // @TODO maybe set this to lower

    useStore.setState({
      pendingTransactions: [
        ...pendingTransactions,
        {
          ...transaction,
          onComplete: () => {
            toast.success("Lockup unstaked", {
              hideProgressBar: true,
            });
            reloadTotalBalances();
            reloadAccountBalances();
            reloadLockups();
          },
        },
      ],
    });
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
              <th>Duration remaining</th>
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
                    className="btn rounded-full btn-sm btn-primary"
                    href={`/stake/${lockup.lockupId}`}
                  >
                    Extend
                  </Link>
                </td>
                <td>
                  <Button
                    white
                    small
                    disabled={Date.now() / 1000 < lockup.end}
                    onClick={() => handleUnlock(lockup.lockupId)}
                  >
                    Unstake
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {ogv.gt(0) ? (
        <div className="mt-4">
          <Link className="btn btn-primary btn-lg" href="/stake/new">
            {lockups.length > 0 ? "Create a new stake" : "Stake your OGV now"}
          </Link>
        </div>
      ) : (
        <p className="text-gray-600 pt-4">
          You currently have no OGV to stake.
        </p>
      )}
    </Card>
  );
};

export default YourLockups;
