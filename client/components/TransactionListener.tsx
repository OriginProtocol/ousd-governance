import { useEffect, useState } from "react";
import { usePrevious } from "utils/index";
import { useStore } from "utils/store";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { isMobile } from "react-device-detect";
import { useRouter } from "next/router";

export const TransactionListener = () => {
  const { provider, pendingTransactions } = useStore();
  const router = useRouter();
  const prevPendingTransactions = usePrevious(pendingTransactions);
  const [isOnClaimPage, setIsOnClaimPage] = useState(false);

  useEffect(() => {
    const newIsOnClaimPage = router.pathname === "/claim";
    // navigating away from the claim page
    if (!newIsOnClaimPage && isOnClaimPage) {
      // dismiss all toasts that may have been seen on the claim page
      toast.dismiss();
    }
    setIsOnClaimPage(newIsOnClaimPage);
  }, [router.pathname]);

  useEffect(() => {
    if (!prevPendingTransactions) return;
    const newTransactions = pendingTransactions.filter(
      (x) => !prevPendingTransactions.includes(x)
    );

    if (newTransactions.length > 0) {
      newTransactions.forEach((transaction) => {
        provider.once(transaction.hash, (minedTransaction) => {
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

  return (
    <ToastContainer
      theme="dark"
      /* to not over clutter the screen show only 2 toasts on mobile device
       */
      limit={isMobile ? 2 : 5}
      /* leave toast opened for 55 seconds when on claim page so other address claim
       * toasts can fill up 5 notifications limit and then slowly new ones enter and
       * old ones get removed.
       */
      autoClose={isOnClaimPage ? 55000 : 5000}
    />
  );
};
