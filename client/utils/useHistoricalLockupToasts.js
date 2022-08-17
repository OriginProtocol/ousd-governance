import { useEffect, useState } from "react";
import { sample, random, maxBy, includes } from "lodash";
import { useStore } from "utils/store";
import { toast } from "react-toastify";
import { utils } from "ethers";
import { truncateEthAddress } from "utils";
import { SECONDS_IN_A_MONTH } from "../constants/index";
import TokenAmount from "components/TokenAmount";
import Link from "components/Link";
import ExternalLinkIcon from "components/icons/ExternalLinkIcon";

const _LockupContent = ({ shortAddress, ogvLockedUp, months, txHash }) => {
  return (
    <div>
      <div>
        {`${shortAddress} recently staked `}
        <TokenAmount amount={ogvLockedUp} format="currency_no_decimals" />
        {` OGV for ${months} months`}
      </div>
      <Link
        href={`https://etherscan.io/tx/${txHash}`}
        type="external"
        className="flex content-center mt-2"
        newWindow={true}
      >
        <ExternalLinkIcon isGreen={true} />
        <div className="ml-2">View on Etherscan</div>
      </Link>
    </div>
  );
};

const useHistoricalLockupToasts = () => {
  const { web3Provider, contracts, recentLockups } = useStore();
  // 13.13 seconds is average block time (on 7.7.2022) ~
  const blocksToLookBack = 1300; // roughly 2 days

  const displayToast = async (event) => {
    const address = event.args[0];
    const ogvLockedUp = event.args[2];
    const lockUpEnd = parseInt(event.args[3]);
    const blockTime =
      (await web3Provider?.getBlock(event.blockNumber)).timestamp ||
      Date.now() / 1000;
    const durationInMonths = Math.round(
      (lockUpEnd - blockTime) / SECONDS_IN_A_MONTH
    );

    const shortAddress =
      web3Provider?.chainId === 1
        ? (await web3Provider.lookupAddress(address)) ||
          truncateEthAddress(address)
        : truncateEthAddress(address);

    toast.success(
      <_LockupContent
        shortAddress={shortAddress}
        ogvLockedUp={ogvLockedUp}
        months={durationInMonths}
        txHash={event.transactionHash}
      />,
      {
        hideProgressBar: true,
        position: "bottom-right",
      }
    );
  };

  useEffect(() => {
    const newStakeListener = (...params) => {
      const event = params[params.length - 1];
      // fetch actual state, and not a version that was added to function
      const recentLockups = useStore.getState().recentLockups;

      const addEvent = (event, showIt) => {
        useStore.setState({
          recentLockups: [
            ...recentLockups,
            {
              shown: !showIt,
              rawEvent: event,
            },
          ],
        });
      };

      /* TODO: decide whether to add event to array of events and show at a predictable pace
       * OR show events immediately in real-time
       */

      // OPTION 1: uncomment this for show new event at predictable pace
      //addEvent(event, true);

      // OPTION 2: show event immediately
      // sometimes listener will fetch events that have already happened
      if (
        !includes(
          recentLockups.map((e) => e.rawEvent.transactionHash),
          event.transactionHash
        )
      ) {
        addEvent(event, false);
        displayToast(event);
      }
    };

    const getPastStakes = async () => {
      // contracts not loaded or lockups already initialized
      if (!contracts.loaded || recentLockups.length > 0) {
        return;
      }

      const { OgvStaking } = contracts;
      const stakesFilter = OgvStaking.filters.Stake();
      const events = await OgvStaking.queryFilter(
        stakesFilter,
        blocksToLookBack
      );

      useStore.setState({
        recentLockups: events.map((event) => {
          return {
            shown: false,
            rawEvent: event,
          };
        }),
      });

      // subscribe for events only after past events have already been fetched
      OgvStaking.on(stakesFilter, newStakeListener);
    };

    getPastStakes();

    return () => {
      if (!contracts.loaded) {
        return;
      }

      const { OgvStaking } = contracts;
      const stakesFilter = OgvStaking.filters.Stake();
      // unsubscribe
      OgvStaking.off(stakesFilter, newStakeListener);
    };
  }, [contracts, recentLockups]);

  useEffect(() => {
    const alertLoop = setInterval(async () => {
      // latest non shown event
      const latestEvent = maxBy(
        recentLockups.filter((event) => !event.shown),
        (event) => event.rawEvent.blockNumber
      );

      if (!latestEvent) {
        return;
      }

      latestEvent.shown = true;
      const otherEvents = recentLockups.filter(
        (event) =>
          event.rawEvent.transactionHash !==
          latestEvent.rawEvent.transactionHash
      );

      useStore.setState({
        recentLockups: [...otherEvents, latestEvent],
      });

      displayToast(latestEvent.rawEvent);
    }, random(5000, 12000, true));

    return () => clearInterval(alertLoop);
  }, [recentLockups]);
};

export default useHistoricalLockupToasts;
