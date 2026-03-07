-- CreateEnum
CREATE TYPE "FeedingType" AS ENUM ('BREAST', 'BOTTLE');

-- CreateEnum
CREATE TYPE "NappyType" AS ENUM ('WET', 'DIRTY', 'MIXED');

-- CreateTable
CREATE TABLE "Baby" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Baby_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feeding" (
    "id" TEXT NOT NULL,
    "babyId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "type" "FeedingType" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feeding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sleep" (
    "id" TEXT NOT NULL,
    "babyId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sleep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Nappy" (
    "id" TEXT NOT NULL,
    "babyId" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL,
    "type" "NappyType" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Nappy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Feeding_babyId_startedAt_idx" ON "Feeding"("babyId", "startedAt");

-- CreateIndex
CREATE INDEX "Sleep_babyId_startedAt_idx" ON "Sleep"("babyId", "startedAt");

-- CreateIndex
CREATE INDEX "Nappy_babyId_changedAt_idx" ON "Nappy"("babyId", "changedAt");

-- AddForeignKey
ALTER TABLE "Feeding" ADD CONSTRAINT "Feeding_babyId_fkey" FOREIGN KEY ("babyId") REFERENCES "Baby"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sleep" ADD CONSTRAINT "Sleep_babyId_fkey" FOREIGN KEY ("babyId") REFERENCES "Baby"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Nappy" ADD CONSTRAINT "Nappy_babyId_fkey" FOREIGN KEY ("babyId") REFERENCES "Baby"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
