import useAccountBalances from "utils/useAccountBalances";
import useTotalBalances from "utils/useTotalBalances";
import useContracts from "utils/useContracts";
import { TransactionListener } from "components/TransactionListener";
import "../styles/globals.css";
import Layout from "../components/layout";

export default function App({ Component, pageProps }) {
  useAccountBalances();
  useTotalBalances();
  useContracts();

  return (
    <Layout>
      <Component {...pageProps} />
      <TransactionListener />
    </Layout>
  );
}
