import { ethers } from 'ethers';
import governanceAbi from './abi/Governor.js';

export const provider = new ethers.providers.JsonRpcProvider(
  'https://eth-mainnet.alchemyapi.io/v2/6vvlq0n_hjyPK4myUTJ4PGdD9AXjlPDq'
);
export const governanceAddress = '0x72426BA137DEC62657306b12B1E869d43FeC6eC7';
export const governanceContract = new ethers.Contract(governanceAddress, governanceAbi, provider);

export const addressesContracts = {
  '0x2A8e1E676Ec238d8A992307B495b45B3fEAa5e86': 'OUSD',
  '0xE75D77B1865Ae93c7eaa3040B038D7aA7BC02F70': 'VaultProxy'
};
