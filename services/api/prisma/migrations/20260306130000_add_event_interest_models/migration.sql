-- CreateTable
CREATE TABLE "EventPreRegistration" (
    "id" SERIAL NOT NULL,
    "eventId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventPreRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventReminderSubscription" (
    "id" SERIAL NOT NULL,
    "eventId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventReminderSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EventPreRegistration_eventId_idx" ON "EventPreRegistration"("eventId");

-- CreateIndex
CREATE INDEX "EventPreRegistration_userId_idx" ON "EventPreRegistration"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "EventPreRegistration_eventId_userId_key" ON "EventPreRegistration"("eventId", "userId");

-- CreateIndex
CREATE INDEX "EventReminderSubscription_eventId_idx" ON "EventReminderSubscription"("eventId");

-- CreateIndex
CREATE INDEX "EventReminderSubscription_userId_idx" ON "EventReminderSubscription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "EventReminderSubscription_eventId_userId_key" ON "EventReminderSubscription"("eventId", "userId");

-- AddForeignKey
ALTER TABLE "EventPreRegistration" ADD CONSTRAINT "EventPreRegistration_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventPreRegistration" ADD CONSTRAINT "EventPreRegistration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventReminderSubscription" ADD CONSTRAINT "EventReminderSubscription_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventReminderSubscription" ADD CONSTRAINT "EventReminderSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
