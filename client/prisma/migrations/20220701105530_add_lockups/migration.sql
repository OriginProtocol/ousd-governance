-- CreateTable
CREATE TABLE "lockups" (
    "lockupId" INTEGER NOT NULL,
    "user" TEXT NOT NULL,
    "amount" DECIMAL(78,0) NOT NULL,
    "end" TEXT NOT NULL,
    "points" DECIMAL(78,0) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "lockups_lockupId_key" ON "lockups"("lockupId");
