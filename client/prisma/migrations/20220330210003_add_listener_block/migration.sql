-- CreateTable
CREATE TABLE "listener" (
    "last_seen_block" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "listener_last_seen_block_key" ON "listener"("last_seen_block");
