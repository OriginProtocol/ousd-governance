import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useStore } from "utils/store";

const useGovernance = () => {
  const [proposalThreshold, setProposalThreshold] = useState(
    ethers.BigNumber.from(0)
  );
  const [votePower, setVotePower] = useState(ethers.BigNumber.from(0));
  const { contracts, address, web3Provider } = useStore();

  useEffect(() => {
    const loadProposalThreshold = async () => {
      setProposalThreshold(await contracts.Governance.proposalThreshold());
    };
    if (contracts.loaded) {
      loadProposalThreshold();
    }
  }, [contracts]);

  // Load users vote power
  useEffect(() => {
    const loadVotePower = async () => {
      const votePower = await contracts.OgvStaking.balanceOf(address);
      setVotePower(votePower);
    };
    if (web3Provider && address && contracts.loaded) {
      loadVotePower();
    }
  }, [address, web3Provider, contracts]);

  return {
    proposalThreshold,
    votePower,
  };
};

export default useGovernance;
