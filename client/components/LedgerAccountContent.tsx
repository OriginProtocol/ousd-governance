import React from "react";
import { useWeb3React } from "@web3-react/core";
import { ledgerConnector } from "utils/connectors";
import { useStore } from "utils/store";
import { shortenAddress } from "utils/shortenAddress";

interface LedgerAccountContentProps {
  addresses: string[];
  addressBalances: { [key: string]: number };
  activePath: string;
  next: boolean;
}

const LedgerAccountContent = ({
  addresses,
  addressBalances,
  activePath,
  next,
}: LedgerAccountContentProps) => {
  const { activate } = useWeb3React();

  const onSelectAddress = async (address: string, i: number) => {
    const n = next ? i + 5 : i;
    const path = activePath === "44'/60'/0'/0" ? `44'/60'/${n}'/0` : activePath;
    await ledgerConnector.setPath(path);
    ledgerConnector.setAccount(address);

    await activate(
      ledgerConnector,
      (err) => {
        console.error(err);
      },
      // Do not throw the error, handle it in the onError callback above
      false
    );

    localStorage.setItem("eagerConnect", "Ledger");
    localStorage.setItem("ledgerAccount", address);
    localStorage.setItem(
      "ledgerDerivationPath",
      ledgerConnector.getBaseDerivationPath()!
    );

    useStore.setState({
      walletSelectModalState: false,
      connectorName: "Ledger",
    });
  };

  return (
    <>
      <div
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={`flex flex-col`}
      >
        {addresses.map((address, i) => {
          return (
            <button
              key={address}
              className="text-center"
              onClick={() => onSelectAddress(address, i)}
            >
              {shortenAddress(address)} <br />
              <span className="balance">
                {addressBalances[address] !== undefined && (
                  <>{addressBalances[address]} ETH</>
                )}
              </span>
            </button>
          );
        })}
      </div>
      <style jsx>{`
        button {
          width: 415px;
          height: 55px;
          border-radius: 50px;
          border: solid 1px #1a82ff;
          background-color: white;
          font-size: 16px;
          font-weight: bold;
          text-align: center;
          color: #1a82ff;
          padding: 5px 20px;
          margin: 10px auto;
          line-height: 22px;
        }

        button .balance {
          font-size: 15px;
          color: #808080;
        }
      `}</style>
    </>
  );
};

export default LedgerAccountContent;
