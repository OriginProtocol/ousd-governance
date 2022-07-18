import { FunctionComponent, useState } from "react";
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
import useClaim from "utils/useClaim";
import { getRewardsApy } from "utils/apy";
import { SECONDS_IN_A_MONTH } from "../../constants/index";

interface YourLockupsProps {}

const YourLockups: FunctionComponent<YourLockupsProps> = () => {
  const {
    lockups,
    pendingTransactions,
    contracts,
    balances,
    blockTimestamp,
    totalBalances,
  } = useStore();
  const { ogv, accruedRewards } = balances;
  const { totalPercentageOfLockedUpOgv } = totalBalances;
  const { reloadTotalBalances } = useTotalBalances();
  const { reloadAccountBalances } = useAccountBalances();
  const { reloadLockups } = useLockups();
  const claim = useClaim();
  const [collectRewardsStatus, setCollectRewardsStatus] = useState("ready");

  let collectRewardsButtonText = "";
  if (collectRewardsStatus === "ready") {
    collectRewardsButtonText = "Collect rewards";
  } else if (collectRewardsStatus === "waiting-for-user") {
    collectRewardsButtonText = "Confirm transaction";
  } else if (collectRewardsStatus === "waiting-for-network") {
    collectRewardsButtonText = "Waiting to be mined";
  }

  const totalSupplyVeOgv = claim.staking.totalSupplyVeOgvAdjusted || 0;

  // Standard APY figure, assumes 100 OGV locked for max duration
  const stakingApy = getRewardsApy(
    100 * 1.8 ** (48 / 12),
    100,
    totalSupplyVeOgv
  );

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

  const handleCollectRewards = async () => {
    setCollectRewardsStatus("waiting-for-user");

    let transaction;
    try {
      transaction = await contracts.OgvStaking["collectRewards()"]({
        gasLimit: 1000000,
      }); // @TODO maybe set this to lower
    } catch (e) {
      setCollectRewardsStatus("ready");
      throw e;
    }

    setCollectRewardsStatus("waiting-for-network");

    let receipt;
    try {
      receipt = await contracts.rpcProvider.waitForTransaction(
        transaction.hash
      );
    } catch (e) {
      setCollectRewardsStatus("ready");
      throw e;
    }

    if (receipt.status === 0) {
      setCollectRewardsStatus("ready");
    }

    useStore.setState({
      pendingTransactions: [
        ...pendingTransactions,
        {
          ...transaction,
          onComplete: () => {
            if (receipt.status === 0) {
              toast.error("Error collecting rewards", {
                hideProgressBar: true,
              });
            } else {
              toast.success("Rewards collected", {
                hideProgressBar: true,
              });
            }
            setCollectRewardsStatus("ready");
            reloadAccountBalances();
          },
        },
      ],
    });
  };

  return (
    <Card>
      <div className="mb-20">
        <div className="space-y-4 bg-accent text-white -my-10 -mx-6 p-10 md:-mx-10">
          <h2 className="text-2xl font-bold">
            {totalPercentageOfLockedUpOgv}% of all OGV is currently staked. OGV
            stakers earn {stakingApy.toFixed(2)}% variable APY.
          </h2>
        </div>
      </div>
      {lockups.length > 0 && <SectionTitle>Your stakes</SectionTitle>}
      {lockups.length > 0 && (
        <table className="table table-compact w-full mb-4">
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
                  {Math.floor(
                    (lockup.end - blockTimestamp) / SECONDS_IN_A_MONTH
                  )}{" "}
                  months
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
                    disabled={blockTimestamp < lockup.end}
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
      <div className="space-y-3 flex flex-col md:space-y-0 md:flex-row md:space-x-2">
        {ogv.gt(0) && (
          <div>
            <Link
              className="w-full btn rounded-full normal-case space-x-2 btn-lg h-[3.25rem] min-h-[3.25rem] btn-primary"
              href="/stake/new"
            >
              {lockups.length > 0 ? "Create a new stake" : "Stake your OGV now"}
            </Link>
          </div>
        )}
        {accruedRewards.gt(0) && (
          <div>
            <Button
              onClick={handleCollectRewards}
              disabled={collectRewardsStatus !== "ready"}
              large
              alt
              fullWidth
            >
              {collectRewardsButtonText}
            </Button>
          </div>
        )}
      </div>
      {ogv.eq(0) && lockups.length === 0 && (
        <div className="space-y-4">
          <p className="text-2xl">You can buy OGV now on Huobi and Uniswap.</p>
          <Link
            href="https://app.uniswap.org/#/swap?outputCurrency=0x9c354503C38481a7A7a51629142963F98eCC12D0&chain=mainnet"
            newWindow
            className="btn rounded-full normal-case space-x-2 btn-lg h-[3.25rem] min-h-[3.25rem] w-full btn-primary"
          >
            Buy OGV
          </Link>
        </div>
      )}
    </Card>
  );
};

export default YourLockups;
