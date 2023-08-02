import { useEffect, useState } from "react";
import { useStore } from "utils/store";
import { truncateEthAddress } from "utils";
import Icon from "@mdi/react";
import { mdiOpenInNew } from "@mdi/js";

export const Address = ({
  address,
  noTruncate = false,
}: {
  address: string;
  noTruncate?: Boolean;
}) => {
  const { rpcProvider } = useStore();
  const [addressDisplay, setAddressDisplay] = useState(
    noTruncate ? address : truncateEthAddress(address)
  );

  useEffect(() => {
    const loadEns = async () => {
      try {
        const ens = await rpcProvider.lookupAddress(address);
        if (ens) {
          setAddressDisplay(ens);
        }
      } catch (error) {}
    };
    if (rpcProvider) {
      loadEns();
    }
  }, [rpcProvider, address]);

  let explorerPrefix;
  if (rpcProvider?._network?.chainId === 1) {
    explorerPrefix = "https://etherscan.io/";
  } else if (rpcProvider?._network?.chainId === 5) {
    explorerPrefix = "https://goerli.etherscan.io/";
  }

  if (explorerPrefix) {
    return (
      <a
        href={`${explorerPrefix}address/${address}`}
        target="_blank"
        rel="noreferrer"
        className="text-inherit inline-flex items-center gradient-link"
      >
        <span className="mr-1">{addressDisplay}</span>
      </a>
    );
  } else {
    return <>{addressDisplay}</>;
  }
};
