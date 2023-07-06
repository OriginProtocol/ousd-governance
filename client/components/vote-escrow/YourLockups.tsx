import { FunctionComponent, useState } from "react";
import Card from "components/Card";
import Button from "components/Button";
import Link from "components/Link";
import { SectionTitle } from "components/SectionTitle";
import { useStore } from "utils/store";
import { Loading } from "components/Loading";
import { toast } from "react-toastify";
import useAccountBalances from "utils/useAccountBalances";
import Image from "next/image";
import DisabledButtonToolTip from "../DisabledButtonTooltip";
import LockupsTable from "./LockupsTable";
import { Web3Button } from "components/Web3Button";
import useStakingAPY from "utils/useStakingAPY";

interface YourLockupsProps {}

const YourLockups: FunctionComponent<YourLockupsProps> = () => {
  const {
    lockups,
    pendingTransactions,
    contracts,
    balances,
    totalBalances,
    web3Provider,
  } = useStore();
  const { ogv, accruedRewards } = balances;
  const { totalPercentageOfLockedUpOgv } = totalBalances;
  const { reloadAccountBalances } = useAccountBalances();
  const [collectRewardsStatus, setCollectRewardsStatus] = useState("ready");

  let collectRewardsButtonText = "";
  if (collectRewardsStatus === "ready") {
    collectRewardsButtonText = "Collect rewards";
  } else if (collectRewardsStatus === "waiting-for-user") {
    collectRewardsButtonText = "Confirm transaction";
  } else if (collectRewardsStatus === "waiting-for-network") {
    collectRewardsButtonText = "Waiting to be mined";
  }

  // Standard APY figure, assumes 100 OGV locked for max duration
  const { stakingAPY, loading: apyLoading } = useStakingAPY(100, 48);

  if (!lockups) {
    return (
      <Card>
        <Loading />
      </Card>
    );
  }

  const handleCollectRewards = async () => {
    setCollectRewardsStatus("waiting-for-user");

    let transaction;
    try {
      transaction = await contracts.OgvStaking["collectRewards()"]({
        gasLimit: 140000,
      });
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
          <h2 className="text-2xl space-y-1 font-header">
            <span className="block border-b pb-3 border-secondary/[.15]">
              <span className="font-bold bg-secondary px-[4px] py-[1px] rounded gradient-link-alt">
                {totalPercentageOfLockedUpOgv.toFixed(2)}%
              </span>{" "}
              of all OGV is currently staked
            </span>
            <span className="block pt-2">
              OGV stakers earn{" "}
              <span className="font-bold bg-secondary px-[4px] py-[1px] rounded gradient-link-alt">
                {apyLoading ? "--.--" : stakingAPY.toFixed(2)}%
              </span>{" "}
              variable APY
            </span>
          </h2>
        </div>
      </div>
      {lockups.length > 0 && (
        <>
          <SectionTitle>Your stakes</SectionTitle>
          <LockupsTable lockups={lockups} />
        </>
      )}
      {!(ogv.eq(0) && lockups.length === 0) && (
        <div className="space-y-3 flex flex-col items-center md:space-y-0 md:flex-row md:space-x-2">
          <DisabledButtonToolTip
            show={ogv.eq(0)}
            text="You have no OGV to stake yet"
          >
            <div>
              <Link
                className="flex items-center px-4 py-2 text-white bg-gradient-to-r from-gradient-from to-gradient-to rounded-full"
                href="/stake/new"
              >
                {lockups.length > 0
                  ? "Create a new stake"
                  : "Stake your OGV now"}
              </Link>
            </div>
          </DisabledButtonToolTip>
          <DisabledButtonToolTip
            show={accruedRewards.eq(0)}
            text="You have no rewards to collect yet"
          >
            <div>
              <button
                className="text-white px-4 py-2"
                style={{
                  background:
                    "linear-gradient(#1E1F25, #1E1F25) padding-box,linear-gradient(to right, #B361E6 20%, #6A36FC 80%) border-box",
                  borderRadius: "50em",
                  border: "1px solid transparent",
                  borderImage: "linear-gradient(90deg, #B361E6, #6A36FC) 1",
                }}
                onClick={handleCollectRewards}
                disabled={
                  collectRewardsStatus !== "ready" || accruedRewards.eq(0)
                }
              >
                {collectRewardsButtonText}
              </button>
            </div>
          </DisabledButtonToolTip>
        </div>
      )}
      {ogv.eq(0) && lockups.length === 0 && (
        <div className="space-y-4">
          <p className="text-lg text-center font-header">
            OGV is available on many top exchanges
          </p>
          <ul className="flex space-x-2 items-center justify-center">
            <li className="flex-1">
              <Link
                href="https://www.huobi.com/en-us/exchange/ogv_usdt"
                newWindow
                className="hover:opacity-80"
              >
                <Image src="/huobi.svg" alt="Huobi" width={300} height={105} />
              </Link>
            </li>
            <li className="flex-1 px-4">
              <Link
                href="https://www.gate.io/trade/OGV_USDT"
                newWindow
                className="hover:opacity-80"
              >
                <Image src="/gateio.svg" alt="Gate" width={1800} height={638} />
              </Link>
            </li>
            <li className="flex-1 px-4">
              <Link
                href="https://app.uniswap.org/#/swap?outputCurrency=0x9c354503C38481a7A7a51629142963F98eCC12D0&chain=mainnet"
                newWindow
                className="hover:opacity-80"
              >
                <Image
                  src="/uniswap.png"
                  alt="Uniswap"
                  width={300}
                  height={75}
                />
              </Link>
            </li>
          </ul>
          {web3Provider ? (
            <Link
              href="https://app.uniswap.org/#/swap?outputCurrency=0x9c354503C38481a7A7a51629142963F98eCC12D0&chain=mainnet"
              newWindow
              className="flex items-center justify-center w-full py-3 text-white px-6 bg-gradient-to-r from-gradient-from to-gradient-to rounded-full"
            >
              Buy OGV
            </Link>
          ) : (
            <Web3Button inPage />
          )}
        </div>
      )}
    </Card>
  );
};

export default YourLockups;
