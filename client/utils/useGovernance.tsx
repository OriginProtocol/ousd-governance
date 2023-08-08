import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useStore } from "utils/store";
import { useAccount } from "wagmi";

const useGovernance = () => {
  const [proposalThreshold, setProposalThreshold] = useState(
    ethers.BigNumber.from(0)
  );
  const [votePower, setVotePower] = useState(ethers.BigNumber.from(0));
  const { address, isConnected } = useAccount();
  const { contracts } = useStore();

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
    if (isConnected && address && contracts.loaded) {
      loadVotePower();
    }
  }, [address, isConnected, contracts]);

  return {
    proposalThreshold,
    votePower,
  };
};

export default useGovernance;
