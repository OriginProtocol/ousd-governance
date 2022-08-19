/*
  Warnings:

  - A unique constraint covering the columns `[A,B]` on the table `_proposal_to_voter` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[last_seen_block]` on the table `listener` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[lockup_id,user]` on the table `lockups` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[proposal_id]` on the table `proposals` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[address]` on the table `voters` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_lockupId_fkey";

-- DropIndex
DROP INDEX "_proposal_to_voter_AB_unique";

-- DropIndex
DROP INDEX "_proposal_to_voter_B_index";

-- DropIndex
DROP INDEX "listener_last_seen_block_key";

-- DropIndex
DROP INDEX "lockups_lockup_id_user_key";

-- DropIndex
DROP INDEX "proposals_proposal_id_key";

-- DropIndex
DROP INDEX "transactions_hash_lockupId_key";

-- DropIndex
DROP INDEX "voters_address_key";

-- AlterTable
ALTER TABLE "proposals" ADD COLUMN     "status" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "proposalId" INTEGER,
ALTER COLUMN "hash" DROP NOT NULL,
ALTER COLUMN "lockupId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "_proposal_to_voter_AB_unique" ON "_proposal_to_voter"("A", "B");

-- CreateIndex
CREATE INDEX "_proposal_to_voter_B_index" ON "_proposal_to_voter"("B");

-- CreateIndex
CREATE UNIQUE INDEX "listener_last_seen_block_key" ON "listener"("last_seen_block");

-- CreateIndex
CREATE UNIQUE INDEX "lockups_lockup_id_user_key" ON "lockups"("lockup_id", "user");

-- CreateIndex
CREATE UNIQUE INDEX "proposals_proposal_id_key" ON "proposals"("proposal_id");

-- CreateIndex
CREATE UNIQUE INDEX "voters_address_key" ON "voters"("address");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "proposals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_lockupId_fkey" FOREIGN KEY ("lockupId") REFERENCES "lockups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
