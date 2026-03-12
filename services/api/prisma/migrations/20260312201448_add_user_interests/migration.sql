-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('TICKET_CONFIRMATION', 'EVENT_REMINDER', 'EVENT_UPDATE', 'NEW_EVENT', 'EVENT_CANCELLED', 'EVENT_RATED_THANKS', 'PERSONALIZED_EVENT', 'EMAIL_REQUEST', 'STAFF_INVITATION');

-- AlterTable
ALTER TABLE "NotificationLog" ADD COLUMN     "message" TEXT,
ADD COLUMN     "referenceId" TEXT,
ADD COLUMN     "type" "NotificationType";

-- AlterTable
ALTER TABLE "UserProfile" ADD COLUMN     "interests" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "location" TEXT,
ADD COLUMN     "notificationPreferences" JSONB;

-- CreateTable
CREATE TABLE "EventLike" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "eventId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventRating" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "eventId" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventRating_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EventLike_eventId_idx" ON "EventLike"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "EventLike_userId_eventId_key" ON "EventLike"("userId", "eventId");

-- CreateIndex
CREATE INDEX "EventRating_eventId_idx" ON "EventRating"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "EventRating_userId_eventId_key" ON "EventRating"("userId", "eventId");

-- AddForeignKey
ALTER TABLE "EventLike" ADD CONSTRAINT "EventLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventLike" ADD CONSTRAINT "EventLike_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRating" ADD CONSTRAINT "EventRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRating" ADD CONSTRAINT "EventRating_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
