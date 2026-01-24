-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "additionalPolicy" TEXT,
ADD COLUMN     "descriptionAm" TEXT,
ADD COLUMN     "hasSeatMap" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "minAge" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "seatMapConfig" TEXT,
ADD COLUMN     "titleAm" TEXT;

-- AlterTable
ALTER TABLE "HomepageBanner" ADD COLUMN     "clickCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "ctaText" TEXT DEFAULT 'Learn More',
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "priority" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "startDate" TIMESTAMP(3),
ADD COLUMN     "targetRules" JSONB,
ADD COLUMN     "viewCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "OrganizerProfile" ADD COLUMN     "businessAddress" JSONB,
ADD COLUMN     "categoryFocus" TEXT[],
ADD COLUMN     "defaultConfig" JSONB,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "notificationPrefs" JSONB,
ADD COLUMN     "operatingCities" TEXT[],
ADD COLUMN     "socialLinks" JSONB,
ADD COLUMN     "supportEmail" TEXT,
ADD COLUMN     "supportPhone" TEXT,
ADD COLUMN     "websiteUrl" TEXT;

-- AlterTable
ALTER TABLE "TicketTier" ADD COLUMN     "maxPerUser" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "salesEnd" TIMESTAMP(3),
ADD COLUMN     "salesStart" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "SystemConfig" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SystemConfig_key_key" ON "SystemConfig"("key");
