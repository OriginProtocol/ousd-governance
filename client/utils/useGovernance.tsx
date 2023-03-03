import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useStore } from "utils/store";
import { useWeb3React } from "@web3-react/core";

const useGovernance = () => {
  const [proposalThreshold, setProposalThreshold] = useState(
    ethers.BigNumber.from(0)
  );
  const [votePower, setVotePower] = useState(ethers.BigNumber.from(0));
  const { contracts, web3Provider } = useStore();
  const { account: address } = useWeb3React();

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
