/*
  Warnings:

  - You are about to drop the `Hiccup` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Hiccup" DROP CONSTRAINT "Hiccup_babyId_fkey";

-- DropForeignKey
ALTER TABLE "Hiccup" DROP CONSTRAINT "Hiccup_sessionId_fkey";

-- DropTable
DROP TABLE "Hiccup";
