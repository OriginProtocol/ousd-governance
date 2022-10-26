require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-waffle");
require("hardhat-deploy");
require("hardhat-deploy-ethers");
require("@nomiclabs/hardhat-etherscan");
require('dotenv').config();


module.exports = {
  networks: {
    hardhat: {
      forking: {
        url: process.env.PROVIDER_URL,
        enabled: false,
        blockNumber: 15830700
      },
      hardfork: "london",
      // base fee of 0 allows use of 0 gas price when testing
      initialBaseFeePerGas: 0,
      // brownie expects calls and transactions to throw on revert
      throwOnTransactionFailures: true,
      throwOnCallFailures: true,
      accounts: {
        mnemonic:
          "there reopen orchard damage width skirt resource clap device idle tag twelve",
      },
    },
  },
  solidity: {
    version: '0.8.10',
    settings: {
      optimizer: {
        enabled: true,
        runs: 10000,
      }
    }
  },
};
