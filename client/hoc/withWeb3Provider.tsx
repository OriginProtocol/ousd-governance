import { useEffect, useState } from "react";
import {
  Web3Provider,
  ExternalProvider,
  JsonRpcFetchFunc,
} from "@ethersproject/providers";
import { Web3ReactProvider } from "@web3-react/core";
import { NextPageContext } from "next";

const withWeb3Provider = (WrappedComponent: any) => {
  function getLibrary(provider: ExternalProvider | JsonRpcFetchFunc) {
    const library = new Web3Provider(provider);
    library.pollingInterval = 12000;
    return library;
  }

  const Wrapper = (props: any) => {
    return (
      <Web3ReactProvider getLibrary={getLibrary}>
        <WrappedComponent {...props} />
      </Web3ReactProvider>
    );
  };

  if (WrappedComponent.getInitialProps) {
    Wrapper.getInitialProps = async (ctx: NextPageContext) => {
      const componentProps = await WrappedComponent.getInitialProps(ctx);
      return componentProps;
    };
  }

  return Wrapper;
};

export default withWeb3Provider;
