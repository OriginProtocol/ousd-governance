import { NextPageContext } from "next";
import React from "react";
import { useStore } from "utils/store";

const withWalletSelectModal = (WrappedComponent: any) => {
  const Wrapper = (props: any) => {
    const showLogin = () => {
      useStore.setState({ walletSelectModalState: "Wallet" });
    };
    return <WrappedComponent {...props} showLogin={showLogin} />;
  };

  if (WrappedComponent.getInitialProps) {
    Wrapper.getInitialProps = async (ctx: NextPageContext) => {
      const componentProps = await WrappedComponent.getInitialProps(ctx);
      return componentProps;
    };
  }

  return Wrapper;
};

export default withWalletSelectModal;
