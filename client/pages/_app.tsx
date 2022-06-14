import useAccountBalances from "utils/useAccountBalances";
import useTotalBalances from "utils/useTotalBalances";
import useContracts from "utils/useContracts";
import { TransactionListener } from "components/TransactionListener";
import "../styles/globals.css";

export default function App({ Component, pageProps }) {
  useAccountBalances();
  useTotalBalances();
  useContracts();

  return (
    <>
      <Component {...pageProps} />
      <TransactionListener />
    </>
  );
}
