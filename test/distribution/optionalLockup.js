const { expect } = require('chai');
const { ethers } = require('hardhat');
const { bnDecimal, deploy, getBlockNumber, merkleProof, increaseTime, mineBlocks, week, invalidMerkleProof } = require('../../scripts/helpers');
const { deploymentFixture } = require('../fixture');

// Tests for OptionalLockupDistributor
describe('Contract: OptionalLockupDistributor', async () => {
    beforeEach(async () => {
        ({ ogv, veogv, optionalLockup } = await deploymentFixture());
        [admin, user1, user2, voter, ...addrs] = await ethers.getSigners();

        let amount = bnDecimal(500000000);
        // Transfer to the distributor contract so it has something to give out
        await ogv.transfer(optionalLockup.address, amount);
    })

  describe('Claiming', async () => {
      it('should receive tokens on claim with no lockup', async () => {
        let amount = bnDecimal(500000000);
        let before_balance = await ogv.balanceOf(admin.address);
        await optionalLockup.claim(1, amount, merkleProof, 0);
        // Should have gotten amount transferred back to the contract.
        expect(await ogv.balanceOf(admin.address)).to.be.eq(before_balance.add(amount));
      }),

      it('should reflect balance on claim with lockup', async () => {
        let amount = bnDecimal(500000000);
        let before_balance = await ogv.balanceOf(admin.address);
        // Claim and lock for a week
        await optionalLockup.claim(1, amount, merkleProof, week);
        // Increase time for a week
        await increaseTime(week);
        await mineBlocks(1);
        expect((await veogv.lockups(admin.address, 0))[0]).to.be.eq(amount)
      }),

      it('should\'t be able to claim if claim period has expired', async () => {
        let amount = bnDecimal(500000000);
        await mineBlocks(100);
        await expect(optionalLockup.claim(1, amount, merkleProof, 0)).
          to.be.revertedWith('Can no longer claim. Claim period expired')
      }),

      it('should be able to burn remaining ogv after claim period', async () => {
        await increaseTime(week);
        await mineBlocks(100);
        await optionalLockup.burnRemainingOGV();
        expect(await ogv.balanceOf(optionalLockup.address)).
          to.be.eq(0)
      }),

      it('should\'t be able to burn remaining ogv before claim period', async () => {
        await increaseTime(week);
        await mineBlocks(88); // claim block is set to 100 blocks after start one
        await expect(optionalLockup.burnRemainingOGV()).
          to.be.revertedWith('Can not yet burn the remaining OGV')
      }),

      it('should return true if proof is valid', async () => {
        let amount = bnDecimal(500000000);
        let valid = await optionalLockup.isProofValid(
          1, amount, admin.address, merkleProof
        )
        expect(valid).to.be.eq(true)
      }),

      it('should return false if proof is invalid', async () => {
        let amount = bnDecimal(500000000);
        let valid = await optionalLockup.isProofValid(
          1, amount, admin.address, invalidMerkleProof
        )
        expect(valid).to.be.eq(false)
      }),

      it('should\'t be able to claim with invalid proof', async () => {
        let amount = bnDecimal(500000000);
        await expect(optionalLockup.claim(1, amount, invalidMerkleProof, week)).
          to.be.revertedWith('MerkleDistributor: Invalid proof.')
      })
  })
})
