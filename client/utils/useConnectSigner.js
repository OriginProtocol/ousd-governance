const useConnectSigner = async (_contract, signer) => {
  return _contract.connect(signer);
};

export default useConnectSigner;
