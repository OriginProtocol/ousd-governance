import { useEffect, useState } from "react";
import { useStore } from "utils/store";
import { truncateEthAddress } from "utils";

export const Address = ({ address }: { address: string }) => {
  const { web3Provider } = useStore();
  const [addressDisplay, setAddressDisplay] = useState(
    truncateEthAddress(address)
  );

  useEffect(() => {
    const loadEns = async () => {
      try {
        const ens = await web3Provider.lookupAddress(address);
        if (ens) {
          setAddressDisplay(ens);
        }
      } catch (error) {}
    };
    if (web3Provider) {
      loadEns();
    }
  }, [web3Provider, address]);

  let explorerPrefix;
  if (web3Provider?.chainId === 1) {
    explorerPrefix = "https://etherscan.io/";
  } else if (web3Provider?.chainId === 4) {
    explorerPrefix = "https://rinkeby.etherscan.io/";
  }

  if (explorerPrefix) {
    return (
      <a
        href={`${explorerPrefix}address/${address}`}
        target="_blank"
        rel="noreferrer"
      >
        {addressDisplay}
      </a>
    );
  } else {
    return <>{addressDisplay}</>;
  }
};
