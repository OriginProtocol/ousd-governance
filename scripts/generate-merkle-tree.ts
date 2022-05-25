import fs from 'fs';
import { MerkleTree } from 'merkletreejs';
import keccak256 from 'keccak256';
import addresses from './addresses.json';

const hashedAddresses = Object.keys(addresses).map(address => keccak256(address));
const merkleTree = new MerkleTree(hashedAddresses, keccak256, {sortPairs: true});
const merkleRoot = `0x${merkleTree.getRoot().toString('hex')}`;

const claims = {
    merkleRoot,
    claims: Object.keys(addresses).reduce(
        (claim, address, index) => Object.assign(claim, {
            [address]: {
                index,
                amount: addresses[address as keyof typeof addresses],
                proof: merkleTree.getHexProof(keccak256(address)),
            },
        }),
    {}),
};

fs.writeFileSync('./scripts/claims.json', JSON.stringify(claims, null, 2), 'utf-8');