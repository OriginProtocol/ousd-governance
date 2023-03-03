import React, { useState } from "react";
import { fbt } from "fbt-runtime";
import { useStore } from "utils/store";

import WalletSelectContent from "components/WalletSelectContent";
import LedgerDerivationContent from "components/LedgerDerivationContent";

const WalletSelectModal = ({}) => {
  const { walletSelectModalState: modalState } = useStore();

  const close = () => {
    useStore.setState({ walletSelectModalState: false });
  };

  return (
    <>
      {modalState && (
        // absolute top-0 left-0 bottom-0 right-0 w-full h-full z-[1000]
        <div
          className="login-modal bg-[#18314099] flex items-center justify-center"
          onClick={(e) => {
            e.preventDefault();
            close();
          }}
        >
          {modalState === "Wallet" && <WalletSelectContent />}
          {modalState === "LedgerDerivation" && <LedgerDerivationContent />}
        </div>
      )}
      <style jsx>{`
        .login-modal {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(24, 49, 64, 0.6);
          z-index: 1000;
        }
      `}</style>
    </>
  );
};

export default WalletSelectModal;
