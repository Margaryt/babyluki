-- CreateTable
CREATE TABLE "Burp" (
    "id" TEXT NOT NULL,
    "babyId" TEXT NOT NULL,
    "sessionId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Burp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Burp_babyId_timestamp_idx" ON "Burp"("babyId", "timestamp");

-- CreateIndex
CREATE INDEX "Burp_sessionId_idx" ON "Burp"("sessionId");

-- AddForeignKey
ALTER TABLE "Burp" ADD CONSTRAINT "Burp_babyId_fkey" FOREIGN KEY ("babyId") REFERENCES "Baby"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Burp" ADD CONSTRAINT "Burp_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "FeedingSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
