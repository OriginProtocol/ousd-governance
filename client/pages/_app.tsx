import { useEffect } from "react";
import { claimOpenTimestampPassed } from "utils";
import dynamic from "next/dynamic";
import Script from "next/script";
import useAccountBalances from "utils/useAccountBalances";
import useTotalBalances from "utils/useTotalBalances";
import useContracts from "utils/useContracts";
import useLockups from "utils/useLockups";
import useBlock from "utils/useBlock";
import { useRouter } from "next/router";
import { TransactionListener } from "components/TransactionListener";
import {
  getDefaultWallets,
  RainbowKitProvider,
  connectorsForWallets,
  darkTheme,
} from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "react-query";
import {
  ledgerWallet,
  phantomWallet,
  safeWallet,
  trustWallet,
  zerionWallet,
  mewWallet,
  okxWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { WagmiConfig, createClient, configureChains } from "wagmi";
import { mainnet, localhost } from "wagmi/chains";
import { publicProvider } from "wagmi/providers/public";
import Layout from "../components/layout";
import "@rainbow-me/rainbowkit/styles.css";
import "../styles/globals.css";
import { GTM_ID, pageview } from "../lib/gtm";

const queryClient = new QueryClient();

const { chains, provider } = configureChains(
  [mainnet, localhost],
  [publicProvider()]
);

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_V2_PROJECT_ID;

// Rainbow kit init
const { wallets } = getDefaultWallets({
  appName: "Origin Governance",
  projectId,
  chains,
});

const connectors = connectorsForWallets([
  ...wallets,
  {
    groupName: "Other",
    wallets: [
      mewWallet({ projectId, chains }),
      okxWallet({ projectId, chains }),
      ledgerWallet({ projectId, chains }),
      phantomWallet({ chains }),
      safeWallet({ chains }),
      trustWallet({ projectId, chains }),
      zerionWallet({ projectId, chains }),
    ],
  },
]);

const client = createClient({
  autoConnect: true,
  provider,
  connectors,
});

const kitTheme = darkTheme({
  accentColor: "#396ff6",
  accentColorForeground: "white",
  borderRadius: "large",
  fontStack: "system",
  overlayBlur: "small",
});

const GeoFenceCheck = dynamic(() => import("components/GeoFenceCheck"), {
  ssr: false,
});

const Root = ({ Component, pageProps }) => {
  const router = useRouter();

  useEffect(() => {
    router.events.on("routeChangeComplete", pageview);
    return () => {
      router.events.off("routeChangeComplete", pageview);
    };
  }, [router.events]);

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
      <GeoFenceCheck />
      <Component {...pageProps} />
      <TransactionListener />
    </Layout>
  );
};

const App = ({ Component, pageProps }) => (
  <WagmiConfig client={client}>
    <RainbowKitProvider chains={chains} theme={kitTheme}>
      <QueryClientProvider client={queryClient}>
        <Root Component={Component} pageProps={pageProps} />
      </QueryClientProvider>
    </RainbowKitProvider>
  </WagmiConfig>
);

export default App;
