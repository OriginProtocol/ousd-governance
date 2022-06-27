import fs from 'fs';
import { MerkleTree } from 'merkletreejs';
import { utils, BigNumber } from 'ethers';


const chainId = process.env.CHAIN_ID

if (!chainId) {
  throw new Error('Set CHAIN_ID environment variable')
}

for (const prefix of ['mandatory_lockup', 'optional_lockup']) {
  const accounts = JSON.parse(fs.readFileSync(`./scripts/${chainId}_data/${prefix}_accounts.json`, 'utf-8'))

  const nodes = Object.keys(accounts).map((account, index) => {
      const { amount } = accounts[account as keyof typeof accounts];
      const amountBn = BigNumber.from(amount.hex);
      return utils.solidityKeccak256(['uint256', 'address', 'uint256'], [index, account, amountBn]);
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

  fs.writeFileSync(
      `./scripts/${chainId}_data/${prefix}_claims.json`,
      JSON.stringify(claims, null, 2), 'utf-8'
  );

}
