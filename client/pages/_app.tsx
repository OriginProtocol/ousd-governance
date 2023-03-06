import { useEffect } from "react";
import useAccountBalances from "utils/useAccountBalances";
import useTotalBalances from "utils/useTotalBalances";
import useContracts from "utils/useContracts";
import useLockups from "utils/useLockups";
import useBlock from "utils/useBlock";
import { useRouter } from "next/router";
import { TransactionListener } from "components/TransactionListener";
import "../styles/globals.css";
import Layout from "../components/layout";
import { claimOpenTimestampPassed } from "utils";
import Script from "next/script";
import { GTM_ID, pageview } from "../lib/gtm";
import { withWeb3Provider } from "hoc";
import { useWeb3React } from "@web3-react/core";
import { useStore } from "utils/store";
import useEagerConnect from "utils/useEagerConnect";

export function App({ Component, pageProps }) {
  const router = useRouter();
  const { account } = useWeb3React();
  const resetWeb3State = useStore((state) => state.reset);

  useEffect(() => {
    router.events.on("routeChangeComplete", pageview);
    return () => {
      router.events.off("routeChangeComplete", pageview);
    };
  }, [router.events]);

  // If somebody locks their wallet, "account" from within the Web3React state
  // will be undefined... we want to use that re-render to reset the web3 store.
  useEffect(() => {
    if (!account) resetWeb3State();
  }, [account]);

  useEagerConnect();
  useContracts();
  useTotalBalances();
  useAccountBalances();
  useLockups();
  useBlock();

  return (
    <Layout hideNav={!claimOpenTimestampPassed()}>
      <Script
        id="gtag-base"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer', '${GTM_ID}');
          `,
        }}
      />
      <Component {...pageProps} />
      <TransactionListener />
    </Layout>
  );
}

export default withWeb3Provider(App);
