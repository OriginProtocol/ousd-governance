import { useEffect, useState } from "react";
import { useStore } from "utils/store";

const useConnectSigner = (_contract) => {
  const { web3Provider } = useStore();
  const [contract, setContract] = useState(_contract);

  useEffect(() => {
    const getSignerForContract = async () => {
      if (web3Provider) {
        const signer = await web3Provider.getSigner();
        setContract(_contract.connect(signer));
      }
    };
    getSignerForContract();
  }, [web3Provider]);

  return contract;
};

export default useConnectSigner;
