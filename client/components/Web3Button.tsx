import Link from "next/link";
import { ConnectButton as RainbowKitConnect } from "@rainbow-me/rainbowkit";
import useShowDelegationModalOption from "utils/useShowDelegationModalOption";
import classnames from "classnames";

const ConnectButton = ({ inPage = false, needToShowDelegation = false }) => {
  const connectText = inPage ? "Connect wallet" : "Connect";
  return (
    <RainbowKitConnect.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        // Note: If your app doesn't use authentication, you
        // can remove all 'authenticationStatus' checks
        const ready = mounted && authenticationStatus !== "loading";

        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === "authenticated");

        return (
          <div
            {...(!ready && {
              "aria-hidden": true,
              style: {
                opacity: 0,
                pointerEvents: "none",
                userSelect: "none",
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button
                    className={classnames(
                      "flex items-center justify-center text-sm py-2 text-white px-4 bg-gradient-to-r from-gradient-from to-gradient-to rounded-full",
                      {
                        "w-full": inPage,
                      }
                    )}
                    onClick={() => {
                      openConnectModal();
                    }}
                    type="button"
                  >
                    {connectText}
                  </button>
                );
              }

              if (chain.unsupported) {
                return (
                  <button
                    className="flex items-center justify-center text-sm py-2 text-white px-4 bg-error rounded-full"
                    onClick={openChainModal}
                    type="button"
                  >
                    Wrong Network
                  </button>
                );
              }

              return (
                <div className="flex flex-row items-center space-x-2">
                  <button
                    onClick={openAccountModal}
                    type="button"
                    className="flex flex-row items-center space-x-2 p-3 bg-secondary-content text-white rounded-full text-sm leading-none cursor-pointer"
                  >
                    <span className="w-3 h-3 bg-[#4bbc8a] rounded-full" />
                    <span>{account.displayName}</span>
                  </button>
                  {needToShowDelegation && (
                    <Link href="/register-vote">
                      <button className="hidden lg:flex items-center justify-center text-sm py-2 text-white px-3 bg-gradient-to-r from-gradient-from to-gradient-to rounded-full">
                        Vote register
                      </button>
                    </Link>
                  )}
                </div>
              );
            })()}
          </div>
        );
      }}
    </RainbowKitConnect.Custom>
  );
};

interface Web3ButtonProps {
  inPage?: boolean;
}

export const Web3Button = ({ inPage }: Web3ButtonProps) => {
  const { needToShowDelegation } = useShowDelegationModalOption();
  return (
    <ConnectButton
      inPage={inPage}
      needToShowDelegation={needToShowDelegation}
    />
  );
};
