import { useWeb3React } from "@web3-react/core";
import { useEffect, useState } from "react";
import {
  gnosisConnector,
  injectedConnector,
  ledgerConnector,
} from "./connectors";
import { useStore } from "./store";

function useEagerConnect() {
  const { activate, active } = useWeb3React();

  const [triedEager, setTriedEager] = useState(false);
  const [triedSafeMultisig, setTriedSafeMultisig] = useState(false);
  const [isSafeMultisig, setIsSafeMultisig] = useState(false);

  // Attempt to use Gnosis Safe Multisig if available
  useEffect(() => {
    async function attemptSafeConnection() {
      if (!process.browser) return;

      const gconnector = gnosisConnector();
      // OK to use Gnosis Safe?
      const canUseGnosisSafe = await gconnector?.isSafeApp();

      try {
        await activate(gconnector!, undefined, true);
      } catch (error) {
        // Outside of Safe context
        console.debug(error);
        setTriedSafeMultisig(true);
        return;
      }

      useStore.setState({ connectorName: "Gnosis" });

      setIsSafeMultisig(true);
      setTriedSafeMultisig(true);
    }

    attemptSafeConnection();
  }, [process.browser]); // Try this when Safe multisig connector is started

  // Attempt to use injectedConnector connector
  useEffect(() => {
    async function attemptEagerConnection() {
      // Must try Safe multisig before injectedConnector connector, don't do anything
      // further if using Safe multisig
      if (!triedSafeMultisig || isSafeMultisig) return;

      const eagerConnect = localStorage.getItem("eagerConnect");
      // Local storage request we don't try eager connect
      if (eagerConnect === "false") return;

      if (eagerConnect === "MetaMask" || eagerConnect === "true") {
        const canUseInjected =
          !triedEager &&
          injectedConnector &&
          (await injectedConnector.isAuthorized());
        if (!canUseInjected) return;

        try {
          await activate(injectedConnector, undefined, true);
        } catch (error) {
          console.debug(error);
          return;
        } finally {
          setTriedEager(true);
        }

        useStore.setState({ connectorName: "Metamask" });
      } else if (eagerConnect === "Ledger") {
        try {
          await ledgerConnector.activate();
          const ledgerDerivationPath = localStorage.getItem(
            "ledgerDerivationPath"
          );
          const ledgerAccount = localStorage.getItem("ledgerAccount");
          if (ledgerDerivationPath) {
            await ledgerConnector.setPath(ledgerDerivationPath);
          }
          if (ledgerAccount) {
            await ledgerConnector.setAccount(ledgerAccount);
          }
          await activate(ledgerConnector, undefined, true);
        } catch (error) {
          console.debug(error);
          return;
        } finally {
          setTriedEager(true);
        }
        useStore.setState({ connectorName: "Ledger" });
      }
    }
    attemptEagerConnection();
  }, [triedSafeMultisig]); // Try this only after Safe multisig has been attempted
  return triedEager;
}

export default useEagerConnect;
