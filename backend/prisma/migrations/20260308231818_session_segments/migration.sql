/*
  Warnings:

  - You are about to drop the `Feeding` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "SegmentSide" AS ENUM ('LEFT', 'RIGHT', 'BOTTLE');

-- DropForeignKey
ALTER TABLE "Feeding" DROP CONSTRAINT "Feeding_babyId_fkey";

-- DropTable
DROP TABLE "Feeding";

-- DropEnum
DROP TYPE "FeedingType";

-- CreateTable
CREATE TABLE "FeedingSession" (
    "id" TEXT NOT NULL,
    "babyId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedingSegment" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "side" "SegmentSide" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "volumeMl" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedingSegment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FeedingSession_babyId_startedAt_idx" ON "FeedingSession"("babyId", "startedAt");

-- CreateIndex
CREATE INDEX "FeedingSegment_sessionId_startedAt_idx" ON "FeedingSegment"("sessionId", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "FeedingSegment_sessionId_order_key" ON "FeedingSegment"("sessionId", "order");

-- AddForeignKey
ALTER TABLE "FeedingSession" ADD CONSTRAINT "FeedingSession_babyId_fkey" FOREIGN KEY ("babyId") REFERENCES "Baby"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedingSegment" ADD CONSTRAINT "FeedingSegment_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "FeedingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
