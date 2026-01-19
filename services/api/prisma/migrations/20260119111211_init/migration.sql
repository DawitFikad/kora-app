-- AlterTable
ALTER TABLE "Event" ALTER COLUMN "feeFixed" DROP NOT NULL,
ALTER COLUMN "feeFixed" DROP DEFAULT,
ALTER COLUMN "feePercentage" DROP NOT NULL,
ALTER COLUMN "feePercentage" DROP DEFAULT,
ALTER COLUMN "feeType" DROP NOT NULL,
ALTER COLUMN "feeType" DROP DEFAULT;

-- AlterTable
ALTER TABLE "OrganizerProfile" ADD COLUMN     "feeFixed" DECIMAL(10,2),
ADD COLUMN     "feePercentage" DECIMAL(10,2),
ADD COLUMN     "feeType" TEXT;

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "basePrice" DECIMAL(10,2),
ADD COLUMN     "commissionAmt" DECIMAL(10,2),
ADD COLUMN     "commissionRate" DECIMAL(10,2),
ADD COLUMN     "convenienceFee" DECIMAL(10,2) DEFAULT 0.0,
ADD COLUMN     "organizerNet" DECIMAL(10,2),
ADD COLUMN     "platformNet" DECIMAL(10,2);

-- CreateTable
CREATE TABLE "HomepageBanner" (
    "id" SERIAL NOT NULL,
    "title" TEXT,
    "subtitle" TEXT,
    "imageUrl" TEXT NOT NULL,
    "linkUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomepageBanner_pkey" PRIMARY KEY ("id")
);
