import { useEffect, useState } from "react";
import { useStore } from "utils/store";
import { truncateEthAddress } from "utils";
import EtherscanIcon from "components/EtherscanIcon";

export const Address = ({ address }: { address: string }) => {
  const { rpcProvider } = useStore();
  const [addressDisplay, setAddressDisplay] = useState(
    truncateEthAddress(address)
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
  } else if (rpcProvider?._network?.chainId === 4) {
    explorerPrefix = "https://rinkeby.etherscan.io/";
  }

  if (explorerPrefix) {
    return (
      <a
        href={`${explorerPrefix}address/${address}`}
        target="_blank"
        rel="noreferrer"
        className="text-inherit hover:underline"
      >
        <span className="mr-1">{addressDisplay}</span>
        <span className="w-3 inline-block">
          <EtherscanIcon />
        </span>
      </a>
    );
  } else {
    return <>{addressDisplay}</>;
  }
};
