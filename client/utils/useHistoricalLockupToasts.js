import { useEffect, useState } from "react";
import { sample, random, maxBy } from "lodash";
import { useStore } from "utils/store";
import { toast } from "react-toastify";
import { utils } from "ethers";
import { truncateEthAddress } from "utils";

const useHistoricalLockupToasts = () => {
  const { web3Provider, contracts } = useStore();
  // 13.13 seconds is average block time (on 7.7.2022) ~
  const blocksToLookBack = 1300; // roughly 2 days
  const SECONDS_IN_A_MONTH = 2629743;
  const [recentLockups, setRecentLocups] = useState([]);
  const [newEvent, setNewEvent] = useState(null);

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
      `${shortAddress} just locked up ${utils.formatUnits(
        ogvLockedUp,
        18
      )} OGV for ${durationInMonths} months`,
      {
        hideProgressBar: true,
        position: "bottom-right",
      }
    );
  };

  /* because of the way event listener handler code does not get access to updated
   * react component state. Separate useEffect is needed to handle populating the
   * recent lockups array.
   */
  useEffect(() => {
    if (!newEvent) {
      return;
    }
    setRecentLocups([
      ...recentLockups,
      {
        shown: false,
        rawEvent: newEvent,
      },
    ]);
    setNewEvent(null);
  }, [newEvent]);

  useEffect(() => {
    const newStakeListener = (...params) => {
      const event = params[params.length - 1];

      /* TODO: decide whether to add event to array of events and show at a predictable pace
       * OR show events immediately in real-time
       */
      // setNewEvent(event); // add at predictable pace
      displayToast(event); // show immediately
    };

    const getPastStakes = async () => {
      if (!contracts.loaded) {
        return;
      }

      const { OgvStaking } = contracts;
      const stakesFilter = OgvStaking.filters.Stake();
      const events = await OgvStaking.queryFilter(
        stakesFilter,
        blocksToLookBack
      );

      setRecentLocups(
        events.map((event) => {
          return {
            shown: false,
            rawEvent: event,
          };
        })
      );

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
  }, [contracts]);

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

      setRecentLocups([...otherEvents, latestEvent]);

      displayToast(latestEvent.rawEvent);
    }, random(5000, 20000, true));

    return () => clearInterval(alertLoop);
  }, [recentLockups]);
};

export default useHistoricalLockupToasts;
