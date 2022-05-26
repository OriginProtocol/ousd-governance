import fs from 'fs';
import { MerkleTree } from 'merkletreejs';
import { utils } from 'ethers';
import accounts from './accounts.json';

const nodes = Object.keys(accounts).map((account, index) => {
    const { amount } = accounts[account as keyof typeof accounts];
    return utils.solidityKeccak256(['uint256', 'address', 'uint256'], [index, account, amount]);
});
const merkleTree = new MerkleTree(nodes, utils.keccak256, {sortPairs: true});
const merkleRoot = `0x${merkleTree.getRoot().toString('hex')}`;

const claims = {
    merkleRoot,
    claims: Object.keys(accounts).reduce(
        (claim, account, index) => Object.assign(claim, {
            [account]: {
                index,
                amount: accounts[account as keyof typeof accounts].amount,
                split: accounts[account as keyof typeof accounts].split,
                proof: merkleTree.getHexProof(
                    utils.solidityKeccak256(
                        ['uint256', 'address', 'uint256'],
                        [index, account, accounts[account as keyof typeof accounts].amount]
                    ),
                ),
            },
        }),
    {}),
};

fs.writeFileSync('./scripts/claims.json', JSON.stringify(claims, null, 2), 'utf-8');