/*
  Warnings:

  - A unique constraint covering the columns `[last_seen_block]` on the table `listener` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[lockup_id,user]` on the table `lockups` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[proposal_id]` on the table `proposals` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[hash,lockupId]` on the table `transactions` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[address]` on the table `voters` will be added. If there are existing duplicate values, this will fail.

*/
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

-- CreateTable
CREATE TABLE "_proposal_to_voter" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

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
CREATE UNIQUE INDEX "transactions_hash_lockupId_key" ON "transactions"("hash", "lockupId");

-- CreateIndex
CREATE UNIQUE INDEX "voters_address_key" ON "voters"("address");

-- AddForeignKey
ALTER TABLE "_proposal_to_voter" ADD FOREIGN KEY ("A") REFERENCES "proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_proposal_to_voter" ADD FOREIGN KEY ("B") REFERENCES "voters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
