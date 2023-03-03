import React, { CSSProperties, useState, useEffect } from "react";
import classnames from "classnames";
//@ts-ignore
import { fbt } from "fbt-runtime";
import { useWeb3React } from "@web3-react/core";
import withWalletSelectModal from "../hoc/withWalletSelectModal";
import { walletLogin } from "../utils/account";
import classNames from "classnames";

interface ConnectButtonProps {
  id?: string;
  style?: CSSProperties;
  trackSource?: string;
  inPage?: boolean;
  showLogin: () => void;
}

const ConnectButton = ({
  id,
  style,
  trackSource,
  inPage,
  showLogin,
}: //   trackSource,
ConnectButtonProps) => {
  const { activate, active } = useWeb3React();
  const [userAlreadyConnectedWallet, setUserAlreadyConnectedWallet] =
    useState(false);

  const defaultClassName = classNames("", {
    "btn btn-outline btn-sm border-[#bbc9da] text-white rounded-full text-sm capitalize font-normal hover:bg-white hover:text-secondary":
      !inPage,
    "btn btn-primary btn-lg rounded-full w-full h-[3.25rem] min-h-[3.25rem]":
      inPage,
  });

  useEffect(() => {
    if (
      !userAlreadyConnectedWallet &&
      localStorage.getItem("userConnectedWallet") === "true"
    ) {
      setUserAlreadyConnectedWallet(true);
    }

    if (!userAlreadyConnectedWallet && active) {
      localStorage.setItem("userConnectedWallet", "true");
    }
  }, [active]);

  return (
    <>
      <button
        className={defaultClassName}
        id={id}
        style={style}
        onClick={() => {
          if (process.browser) {
            //   analytics.track("On Connect", {
            //     category: "general",
            //     label: trackSource,
            //   });
            walletLogin(showLogin, activate);
          }
        }}
      >
        {inPage ? "Connect wallet" : "Connect"}
        {/*fbt("Connect", "Connect button")*/}
      </button>
    </>
  );
};

export default withWalletSelectModal(ConnectButton);
