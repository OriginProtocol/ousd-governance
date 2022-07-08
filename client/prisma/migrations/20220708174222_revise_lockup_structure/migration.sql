/*
  Warnings:

  - You are about to drop the column `amount` on the `lockups` table. All the data in the column will be lost.
  - You are about to drop the column `end` on the `lockups` table. All the data in the column will be lost.
  - You are about to drop the column `points` on the `lockups` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[last_seen_block]` on the table `listener` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[lockupId]` on the table `lockups` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[proposal_id]` on the table `proposals` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[address]` on the table `voters` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "listener_last_seen_block_key";

-- DropIndex
DROP INDEX "lockups_lockupId_key";

-- DropIndex
DROP INDEX "proposals_proposal_id_key";

-- DropIndex
DROP INDEX "voters_address_key";

-- AlterTable
ALTER TABLE "lockups" DROP COLUMN "amount",
DROP COLUMN "end",
DROP COLUMN "points";

-- CreateIndex
CREATE UNIQUE INDEX "listener_last_seen_block_key" ON "listener"("last_seen_block");

-- CreateIndex
CREATE UNIQUE INDEX "lockups_lockupId_key" ON "lockups"("lockupId");

-- CreateIndex
CREATE UNIQUE INDEX "proposals_proposal_id_key" ON "proposals"("proposal_id");

-- CreateIndex
CREATE UNIQUE INDEX "voters_address_key" ON "voters"("address");
