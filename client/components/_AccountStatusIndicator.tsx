import React from "react";
//@ts-ignore
import { fbt } from "fbt-runtime";
import { shortenAddress } from "utils/web3";

import { useOverrideAccount } from "utils/useOverrideAccount";
import { truncateEthAddress } from "utils";
import { useStore } from "utils/store";
import { useWeb3React } from "@web3-react/core";

interface AccountStatusIndicatorProps {
  account?: string | null;
  correctNetwork: boolean;
}

const AccountStatusIndicator = ({
  account,
  correctNetwork,
}: AccountStatusIndicatorProps) => {
  const { account: address } = useWeb3React();
  const { overrideAccount } = useOverrideAccount();
  const { web3Provider } = useStore();

  return (
    <>
      {overrideAccount && (
        <>
          <div className="dot white" />
          {
            <div className="address">
              {`${"readonly" /*fbt("readonly", "readonly")*/}: ${shortenAddress(
                overrideAccount as string,
                true
              )}`}
            </div>
          }
        </>
      )}
      {!correctNetwork && !overrideAccount && (
        <>
          <div className="dot yellow" />
          {address && (
            <div className="address">
              Wrong network
              {/* {fbt("Wrong network", "Wrong network")} */}
            </div>
          )}
        </>
      )}
      {correctNetwork && !overrideAccount && (
        <>
          {web3Provider && web3Provider._network && (
            <label
              tabIndex={0}
              className="flex items-center space-x-2 p-2 md:px-4 border border-[#bbc9da] text-white rounded-full text-sm leading-none capitalize cursor-pointer"
            >
              <span className="w-3 h-3 bg-[#4bbc8a] rounded-full" />
              <div className="invisible md:visible md:flex">
                {truncateEthAddress(address!)}
                {web3Provider._network.name === "unknown" && " / Lh"}
                {web3Provider._network.name === "goerli" && " / Goer"}
              </div>
            </label>
          )}
        </>
      )}
      <style jsx>{`
        .address {
          font-size: 14px;
          color: white;
          margin-left: 10px;
          margin-right: 19px;
          margin-bottom: 2px;
        }

        .dot {
          width: 10px;
          height: 10px;
          margin-left: 10px;
          border-radius: 5px;
          background-color: #ed2a28;
        }

        .dot.white {
          background-color: #fff;
        }

        .dot.green {
          background-color: #00d592;
        }

        .dot.green.yellow {
          background-color: #ffce45;
        }
      `}</style>
    </>
  );
};

export default AccountStatusIndicator;
