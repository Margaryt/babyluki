/*
  Warnings:

  - You are about to drop the `Burp` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "FeedingEventType" AS ENUM ('BURP', 'SPILL', 'COUGH');

-- DropForeignKey
ALTER TABLE "Burp" DROP CONSTRAINT "Burp_babyId_fkey";

-- DropForeignKey
ALTER TABLE "Burp" DROP CONSTRAINT "Burp_sessionId_fkey";

-- DropTable
DROP TABLE "Burp";

-- CreateTable
CREATE TABLE "FeedingEvent" (
    "id" TEXT NOT NULL,
    "babyId" TEXT NOT NULL,
    "sessionId" TEXT,
    "type" "FeedingEventType" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hiccup" (
    "id" TEXT NOT NULL,
    "babyId" TEXT NOT NULL,
    "sessionId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Hiccup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FeedingEvent_babyId_timestamp_idx" ON "FeedingEvent"("babyId", "timestamp");

-- CreateIndex
CREATE INDEX "FeedingEvent_sessionId_idx" ON "FeedingEvent"("sessionId");

-- CreateIndex
CREATE INDEX "Hiccup_babyId_startedAt_idx" ON "Hiccup"("babyId", "startedAt");

-- CreateIndex
CREATE INDEX "Hiccup_sessionId_idx" ON "Hiccup"("sessionId");

-- AddForeignKey
ALTER TABLE "FeedingEvent" ADD CONSTRAINT "FeedingEvent_babyId_fkey" FOREIGN KEY ("babyId") REFERENCES "Baby"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedingEvent" ADD CONSTRAINT "FeedingEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "FeedingSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hiccup" ADD CONSTRAINT "Hiccup_babyId_fkey" FOREIGN KEY ("babyId") REFERENCES "Baby"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hiccup" ADD CONSTRAINT "Hiccup_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "FeedingSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
