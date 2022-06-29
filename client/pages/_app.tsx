import useAccountBalances from "utils/useAccountBalances";
import useTotalBalances from "utils/useTotalBalances";
import useContracts from "utils/useContracts";
import useLockups from "utils/useLockups";
import { TransactionListener } from "components/TransactionListener";
import "../styles/globals.css";
import Layout from "../components/layout";
import { claimOpenTimestampPassed } from "utils";

export default function App({ Component, pageProps }) {
  useContracts();
  useTotalBalances();
  useAccountBalances();
  useLockups();

  return (
    <Layout hideNav={!claimOpenTimestampPassed()}>
      <Component {...pageProps} />
      <TransactionListener />
    </Layout>
  );
}
