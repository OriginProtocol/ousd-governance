import React, { useEffect, useState } from "react";
import { useWeb3React } from "@web3-react/core";

import Dropdown from "components/Dropdown";
import ConnectButton from "@/components/ConnectButton";
import { isCorrectNetwork, switchEthereumChain } from "utils/web3";

import withWalletSelectModal from "hoc/withWalletSelectModal";

import AccountStatusIndicator from "./_AccountStatusIndicator";
import Link from "./Link";
import useShowDelegationModalOption from "utils/useShowDelegationModalOption";
import { useStore } from "utils/store";
import { providers } from "ethers";

interface AccountStatusDropdownProps {
  className?: string;
  showLogin: () => void;
}

const AccountStatusDropdown = ({
  className,
  showLogin,
}: AccountStatusDropdownProps) => {
  const { active, account, chainId, deactivate, library } = useWeb3React();
  const [open, setOpen] = useState(false);
  const correctNetwork = isCorrectNetwork(chainId!);
  const resetWeb3State = useStore((state) => state.reset);

  const { needToShowDelegation } = useShowDelegationModalOption();

  const disconnect = () => {
    setOpen(false);
    deactivate();
    // To clear state
    delete localStorage.walletconnect;
    localStorage.setItem("eagerConnect", "false");
    resetWeb3State();
  };

  return (
    <>
      <Dropdown
        className="dropdown"
        content={
          <div
            tabIndex={0}
            className="dropdown-content absolute top-full mt-3 right-0 bg-white p-3 md:p-4 rounded-xl border shadow-sm w-36 lg:w-full no-animation"
          >
            <button
              className="btn btn-primary btn-sm rounded-btn w-full"
              onClick={disconnect}
            >
              Disconnect
            </button>
            {needToShowDelegation && (
              <Link
                className="btn btn-sm rounded-btn w-full mt-2 whitespace-nowrap"
                href="/register-vote"
              >
                Vote register
              </Link>
            )}
          </div>
        }
        open={open}
        onClose={() => setOpen(false)}
      >
        <a
          className={`flex justify-center items-center clickable ${className} ${
            open ? "open" : ""
          }`}
          onClick={async (e) => {
            e.preventDefault();
            if (!active) {
              showLogin();
            } else if (active && !correctNetwork) {
              // open the dropdown to allow disconnecting, while also requesting an auto switch to mainnet
              await switchEthereumChain();
              setOpen(true);
            } else {
              setOpen(true);
            }
          }}
        >
          {/* The button id is used by StakeBoxBig to trigger connect when no wallet connected */}
          {!active && (
            <ConnectButton
              id="main-dapp-nav-connect-wallet-button"
              connect={true}
              className="btn-nav"
              trackSource="Account dropdown"
            />
          )}
          {active && (
            <AccountStatusIndicator
              correctNetwork={correctNetwork}
              account={account}
            />
          )}
        </a>
      </Dropdown>
      <style jsx>{`
        .dropdown-menu {
          right: 0;
          left: auto;
          top: 135%;
          border-radius: 10px;
          box-shadow: 0 0 14px 0 rgba(24, 49, 64, 0.1);
          border: solid 1px #cdd7e0;
          background-color: #ffffff;
          padding: 20px 30px 20px 20px;
          min-width: 170px;
        }
        .dropdown-menu .dropdown-marble {
          margin-right: 18px;
        }
        .dropdown-menu a:not(:last-child) > div {
          margin-bottom: 10px;
        }

        .dropdown-menu a {
          color: #183140;
        }

        .dropdown-menu a .active {
          font-weight: bold;
        }

        .dropdown-menu a .active .dropdown-marble {
          font-weight: bold;
          background-color: #183140;
        }

        .account-status {
          height: 30px;
          min-width: 30px;
          border-radius: 15px;
          border: solid 1px white;
        }

        .account-status.clickable {
          cursor: pointer;
        }

        .account-status.open {
          background-color: #183140;
        }

        .account-status.open .address {
          color: white;
        }

        .account-status .address {
          font-size: 14px;
          color: white;
          margin-left: 10px;
          margin-right: 19px;
          margin-bottom: 2px;
        }

        .account-status:hover {
          color: inherit;
          text-decoration: none;
        }
      `}</style>
    </>
  );
};

export default withWalletSelectModal(AccountStatusDropdown);
