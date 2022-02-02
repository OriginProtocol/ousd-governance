import { ethers } from 'ethers';
import governanceAbi from './abi/Governor.js';

export const provider = new ethers.providers.JsonRpcProvider(
  'https://eth-mainnet.alchemyapi.io/v2/6vvlq0n_hjyPK4myUTJ4PGdD9AXjlPDq'
);
export const governanceAddress = '0x72426BA137DEC62657306b12B1E869d43FeC6eC7';
export const governanceContract = new ethers.Contract(governanceAddress, governanceAbi, provider);
