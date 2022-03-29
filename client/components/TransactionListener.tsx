import { useEffect } from "react";
import { usePrevious } from "utils/index";
import { useStore } from "utils/store";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export const TransactionListener = () => {
  const { web3Provider, pendingTransactions } = useStore();

  const prevPendingTransactions = usePrevious(pendingTransactions);

  useEffect(() => {
    if (!prevPendingTransactions) return;
    const newTransactions = pendingTransactions.filter(
      (x) => !prevPendingTransactions.includes(x)
    );

    if (newTransactions.length > 0) {
      newTransactions.forEach((transaction) => {
        web3Provider.once(transaction.hash, (minedTransaction) => {
          if (
            transaction.onComplete &&
            typeof transaction.onComplete === "function"
          ) {
            transaction.onComplete(minedTransaction);
          } else {
            toast.success(
              transaction.onComplete || "Transaction is completed",
              {
                hideProgressBar: true,
              }
            );
          }
        });
        toast.info("Transaction is being mined", { hideProgressBar: true });
      });
    }
  }, [pendingTransactions]);

  return <ToastContainer theme="dark" />;
};
