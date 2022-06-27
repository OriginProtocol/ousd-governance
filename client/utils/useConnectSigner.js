import { useEffect, useState } from "react";
import { useStore } from "utils/store";

const useConnectSigner = async (_contract, web3Provider) => {
  const signer = await web3Provider.getSigner();
  return _contract.connect(signer);
};

export default useConnectSigner;
