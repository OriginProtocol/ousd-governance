/*
  Warnings:

  - A unique constraint covering the columns `[last_seen_block]` on the table `listener` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[lockupId,user]` on the table `lockups` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[proposal_id]` on the table `proposals` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[address]` on the table `voters` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `active` to the `lockups` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "listener_last_seen_block_key";

-- DropIndex
DROP INDEX "lockups_lockupId_user_key";

-- DropIndex
DROP INDEX "proposals_proposal_id_key";

-- DropIndex
DROP INDEX "voters_address_key";

-- AlterTable
ALTER TABLE "lockups" ADD COLUMN     "active" BOOLEAN NOT NULL,
ADD COLUMN     "txHashes" TEXT[];

-- CreateIndex
CREATE UNIQUE INDEX "listener_last_seen_block_key" ON "listener"("last_seen_block");

-- CreateIndex
CREATE UNIQUE INDEX "lockups_lockupId_user_key" ON "lockups"("lockupId", "user");

-- CreateIndex
CREATE UNIQUE INDEX "proposals_proposal_id_key" ON "proposals"("proposal_id");

-- CreateIndex
CREATE UNIQUE INDEX "voters_address_key" ON "voters"("address");
