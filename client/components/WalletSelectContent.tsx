import React, { useState, useEffect } from "react";

//@ts-ignore
import { fbt } from "fbt-runtime";
import { useWeb3React } from "@web3-react/core";
import { injectedConnector } from "utils/connectors";
import { walletConnectConnector } from "utils/connectors";
import { myEtherWalletConnector } from "utils/connectors";
import { walletlink, resetWalletConnector } from "utils/connectors";
import { defiWalletConnector } from "utils/connectors";
import { AbstractConnector } from "@web3-react/abstract-connector";
import withIsMobile from "hoc/withIsMobile";

import { useStore } from "utils/store";

import { assetRootPath } from "utils/image";
import { WalletConnectConnector } from "@web3-react/walletconnect-connector";

const WalletSelectContent = ({ isMobile }: { isMobile: boolean }) => {
  const { connector, activate, deactivate, active } = useWeb3React();
  const [error, setError] = useState<Error | string | null>(null);
  const wallets = isMobile
    ? [
        "WalletConnect",
        "Coinbase Wallet",
        "MetaMask",
        "MyEtherWallet",
        "Ledger",
      ]
    : [
        "MetaMask",
        "Ledger",
        "Exodus",
        "Coinbase Wallet",
        "WalletConnect",
        "MyEtherWallet",
        "DeFi Wallet",
      ];

  useEffect(() => {
    if (active) {
      closeWalletSelectModal();
    }
  }, [active]);

  const closeWalletSelectModal = () => {
    useStore.setState({ walletSelectModalState: false });
  };

  const errorMessageMap = (error: string | Error) => {
    if (error === "ledger-error") {
      return "Please use WalletConnect to connect to Ledger Live";
      // fbt(
      //   "Please use WalletConnect to connect to Ledger Live",
      //   "No Ledger on mobile"
      // );
    }
    if (
      error instanceof Error &&
      error.message.includes(
        "No Ethereum provider was found on window.ethereum"
      )
    ) {
      return "No Ethereum wallet detected";
      //  fbt("No Ethereum wallet detected", "No wallet detected");
    }
    return (error as Error).message;
  };

  const onConnect = async (name: string) => {
    setError(null);

    let connector: AbstractConnector;
    if (name === "MetaMask" || name === "Exodus") {
      connector = injectedConnector;
      localStorage.setItem("eagerConnect", name);
    } else if (name === "Ledger") {
      // Display window with derivation path select

      useStore.setState({ walletSelectModalState: "LedgerDerivation" });

      return;
    } else if (name === "MyEtherWallet") {
      connector = myEtherWalletConnector;
    } else if (name === "WalletConnect") {
      connector = walletConnectConnector;
    } else if (name === "Coinbase Wallet") {
      connector = walletlink;
    } else if (name === "DeFi Wallet") {
      //@ts-ignore, will only be undefined on server side
      connector = defiWalletConnector;
    }
    // fix wallet connect bug: if you click the button and close the modal you wouldn't be able to open it again
    if (name === "WalletConnect") {
      resetWalletConnector(connector! as WalletConnectConnector);
    }

    await activate(
      connector!,
      (err) => {
        setError(err);
      },
      // Do not throw the error, handle it in the onError callback above
      false
    );

    useStore.setState({ connectorName: name });
  };

  return (
    <>
      <div
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={`wallet-select-content flex flex-col`}
      >
        <h2>
          Connect a wallet to get started
          {/* {fbt(
            "Connect a wallet to get started",
            "Connect a wallet to get started"
          )} */}
        </h2>
        {wallets.map((name) => {
          return (
            <button
              key={name}
              className={`connector-button flex items-center ${
                isMobile && name === "Ledger" ? "grey" : ""
              }`}
              onClick={() => {
                if (isMobile && name === "MetaMask") {
                  setError(null);
                  window.location.href = process.env.METAMASK_DEEPLINK!;
                } else if (isMobile && name === "Ledger") {
                  setError("ledger-error");
                } else {
                  onConnect(name);
                }
              }}
            >
              <div className="w-1/6 flex justify-end">
                <img
                  src={assetRootPath(
                    `/${name.toLowerCase().replace(/\s+/g, "")}-icon.${
                      name === "DeFi Wallet" ? "png" : "svg"
                    }`
                  )}
                />
              </div>
              <div className="w-2/3">{name}</div>
              <div className="w-1/6"></div>
            </button>
          );
        })}
        {error && (
          <div className="error flex items-center justify-center">
            {errorMessageMap(error)}
          </div>
        )}
      </div>
      <style jsx>{`
        .wallet-select-content {
          padding: 34px 34px 46px 34px;
          max-width: 350px;
          min-width: 350px;
          box-shadow: 0 0 14px 0 rgba(24, 49, 64, 0.1);
          background-color: white;
          border-radius: 10px;
        }

        .wallet-select-content h2 {
          padding-left: 12px;
          padding-right: 12px;
          font-size: 18px;
          font-weight: bold;
          text-align: center;
          line-height: normal;
          margin-bottom: 26px;
        }

        .wallet-select-content .connector-button {
          width: 100%;
          height: 50px;
          border-radius: 25px;
          border: solid 1px #1a82ff;
          background-color: white;
          font-size: 18px;
          font-weight: bold;
          text-align: center;
          color: #1a82ff;
        }

        .wallet-select-content .connector-button:disabled {
          cursor: default;
          opacity: 0.6;
        }

        .wallet-select-content .connector-button img {
          max-height: 27px;
        }

        .wallet-select-content .connector-button img.mew {
          max-height: 30px;
        }

        .wallet-select-content .connector-button:hover {
          background-color: #f8f9fa;
        }

        .wallet-select-content .connector-button:not(:last-child) {
          margin-bottom: 20px;
        }

        .wallet-select-content .grey {
          cursor: default;
          opacity: 0.4;
        }

        .error {
          padding: 5px 8px;
          font-size: 14px;
          line-height: 1.36;
          text-align: center;
          color: #ed2a28;
          border-radius: 5px;
          border: solid 1px #ed2a28;
          min-height: 50px;
          width: 100%;
        }
      `}</style>
    </>
  );
};

export default withIsMobile(WalletSelectContent);
