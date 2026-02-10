-- AlterTable
ALTER TABLE "Session" ALTER COLUMN "refreshTokenHash" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
